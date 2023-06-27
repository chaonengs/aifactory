import { ApiError } from 'next/dist/server/api-utils';

import { AIResource, App, ReceivedMessage } from '.prisma/client/edge';
import { encode } from 'gpt-tokenizer';
import { MessageQueueBody } from 'pages/api/queues/messages';
import { FeishuAppConfig } from 'types/app';
import { ReceiveMessageData, User } from 'types/feishu';
import { createProcessMessageBody } from 'utils/db/helper';
import { getInternalTenantAccessToken, getUser, patchMessage, replyMessage } from 'utils/server/feishu';
import { OpenAIRequest, OpenAIStream } from 'utils/server/openai';
import { MessageDBSaveRequest, Usage } from 'pages/api/db/saveProcesserResult';

const getFeishuUser = async (accessToken: string, userId: string) => {
  const req = {
    user_id_type: 'union_id',
    department_id_type: ''
  };
  const res = await (await getUser(accessToken, userId, 'union_id')).json();
  return res.data?.user;
};

const messageCard = (title: string, message: string, status: string, error: string | null | undefined = null) => {
  const card = {
    config: {
      wide_screen_mode: true
    },
    elements: [
      {
        tag: 'div',
        text: {
          content: message,
          tag: 'plain_text'
        }
      },
      {
        tag: 'div',
        text: {
          content: `[${status}]`,
          tag: 'plain_text'
        }
      }
    ],
    header: {
      template: status === '回复中' ? 'green' : status === '回复完成' ? 'blue' : status === '错误中止' ? 'red' : 'blue',
      title: {
        content: title,
        tag: 'plain_text'
      }
    }
  };

  if (error) {
    card.elements.push({
      tag: 'div',
      text: {
        content: error,
        tag: 'plain_text'
      }
    });
  }
  return JSON.stringify(card);
};

const trySendOrUpdateFeishuCard = async (
  accessToken: string,
  title: string,
  message: string,
  status: string,
  error: string | null,
  replayMessageId: string | null,
  cardMessageId: string | null
) => {
  if (replayMessageId) {
    const repliedMessage = await (
      await replyMessage(accessToken, replayMessageId, {
        content: messageCard(title, message, status, error),
        msg_type: 'interactive'
      })
    ).json();

    //@ts-ignore
    if (repliedMessage.code > 0) {
      throw new ApiError(500, `code: ${repliedMessage.code} : ${repliedMessage.msg}`);
    }
    return repliedMessage.data?.message_id;
  }
  if (cardMessageId) {
    const updatedMessage = await (
      await patchMessage(accessToken, cardMessageId, {
        content: messageCard(title, message, status, error)
      })
    ).json();
    //@ts-ignore
    if (updatedMessage.code > 0) {
      throw new ApiError(500, `code: ${updatedMessage.code} : ${updatedMessage.msg}`);
    }
    return updatedMessage.data;
  }
};

const finish = async ({
  airesult,
  question,
  feishuSender,
  promptTokens,
  completionTokens,
  app,
  receivedMessage,
  isAIAnswer,
  hasError,
}: {
  airesult: string;
  question: string;
  feishuSender: User | null;
  promptTokens: number;
  completionTokens: number;
  app: App;
  receivedMessage: ReceivedMessage;
  isAIAnswer: boolean;
  hasError: boolean;

}) => {
  //@ts-ignore
  const feiShuMessageData = receivedMessage.data as ReceiveMessageData;

  const message = {
    senderUnionId: feishuSender?.union_id || 'anonymous',
    sender: feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous',
    content: question,
    answer: airesult,
    appId: app.id,
    conversationId:  feiShuMessageData.message.root_id || feiShuMessageData.message.message_id,
    receivedMessageId: feiShuMessageData.message.message_id,
    isAIAnswer: isAIAnswer,
    hasError: hasError,
  };

  const usage = {
    promptTokens: promptTokens,
    completionTokens: completionTokens,
    totalTokens: promptTokens + completionTokens
  };

  const params:MessageDBSaveRequest = {
    receivedMessageId: feiShuMessageData.message.message_id,
    data:{
      message,
      usage
    }
  }

  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveProcesserResult`;
  await fetch(url, { method: 'POST', body: JSON.stringify(params) });
};


const makeMessages = ({ receivedMessage, history, app }: MessageQueueBody) => {
  const appConfig = app.config as FeishuAppConfig;
  //@ts-ignore
  const receiveMessageData = receivedMessage.data as ReceiveMessageData;
  const messages = new Array();
  let promptTokens = 0;
  const maxPromptTokens = appConfig.ai?.maxPromptTokens || 2000;
  for (let i = 0; i < history.length; i++) {
    const answerMessage = {
      role: 'assistant',
      content: history[i].answer
    };
    const answerTokens = encode(answerMessage.content).length;
    if (promptTokens + answerTokens > maxPromptTokens) {
      break;
    }
    promptTokens += answerTokens;
    messages.unshift(answerMessage);

    const contentMessage = {
      role: 'user',
      content: history[i].content
    };
    const conentTokens = encode(contentMessage.content).length;
    if (promptTokens + conentTokens > maxPromptTokens) {
      break;
    }
    promptTokens += conentTokens;
    messages.unshift(contentMessage);
  }

  const message = {
    role: 'user',
    content: JSON.parse(receiveMessageData.message.content).text
  };

  messages.push(message);
  return {messages, promptTokens};
};

const processMessage = async ({ receivedMessage, history, app, sensitiveWords }: MessageQueueBody) => {
  const appConfig = app.config as FeishuAppConfig;
  //@ts-ignore
  const feiShuMessageData = receivedMessage.data as ReceiveMessageData;

  const accessToken = (await (await getInternalTenantAccessToken(appConfig.appId, appConfig.appSecret)).json()).tenant_access_token;
  const question = JSON.parse(feiShuMessageData.message.content).text;
  // const chatId = feiShuMessageData.message.chat_id;
  // const chatType = feiShuMessageData.message.chat_type;
  // const senderType = feiShuMessageData.sender.sender_type;

  let answer = '';
  let usage:Usage = {
    promptTokens: 0,
    completionTokens:  0,
    totalTokens: 0
  }

  let feishuSender: User | null = null;
  if (feiShuMessageData.sender.sender_id?.union_id) {
    const u = await getFeishuUser(accessToken, feiShuMessageData.sender.sender_id.union_id);
    if (u) {
      feishuSender = u as User;
    }
  }


  if(sensitiveWords && sensitiveWords.length > 0) {
    answer = '你的提问中存在敏感词，系统忽略本消息。';
    await trySendOrUpdateFeishuCard(accessToken, 'AI助理', answer, '回复完成', null, receivedMessage.id, null);
    await finish({ airesult:answer, question, feishuSender, promptTokens:0, completionTokens:0, app, receivedMessage, isAIAnswer:false, hasError: false });
    return null;
  }


  
  const {messages, promptTokens} = makeMessages({ receivedMessage, history, app, sensitiveWords });
  const repliedMessageId = await trySendOrUpdateFeishuCard(accessToken, 'AI助理', '...', '回复中', null, receivedMessage.id, null);

  //@ts-ignore
  let airesult: string = '';
  let completionTokens = 0;
  let lastSendAt = 0;

  //@ts-ignore
  const aiResource = app.aiResource as AIResource;
  const params: OpenAIRequest = {
    model: aiResource.model,
    key: aiResource.apiKey,
    hostUrl: aiResource.hostUrl,
    type: aiResource.type,
    apiVersion: aiResource.apiVersion,
    maxTokens: appConfig.ai?.maxCompletionTokens || 2000,
    temperature: appConfig.ai?.temperature || 1,
    maxPromptTokens: appConfig.ai?.maxPromptTokens || 2000,
    messages: messages,
    systemPrompt: null,
    stream: true
  };
  const openaiStream = OpenAIStream(
    params,
    async (data) => {
      completionTokens += 1;
      if (data) {
        airesult += data;
        if (Date.now() - lastSendAt > 750) {
          const result = await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复中', null, null, repliedMessageId);
          lastSendAt = Date.now();
        } 
      }
    },
    async (error) => {
      console.error(error);
      await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '错误中止', null, null, repliedMessageId);
      await finish({ airesult, question, feishuSender, promptTokens, completionTokens, app, receivedMessage, isAIAnswer:true , hasError: true });
    },
    async () => {
      // console.log(`enter finish , tokens: ${completionTokens}` )
      await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复完成', null, null, repliedMessageId);
      await finish({ airesult, question, feishuSender, promptTokens, completionTokens, app, receivedMessage, isAIAnswer:true, hasError: false  });
    }
  );
  return openaiStream;
};

export { processMessage };

