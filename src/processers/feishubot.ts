import { ApiError } from 'next/dist/server/api-utils';

import { AIResource, App, RecievedMessage } from '.prisma/client/edge';
import { encode } from 'gpt-tokenizer';
import { MessageQueueBody } from 'pages/api/queues/messages';
import { FeishuAppConfig } from 'types/app';
import { ReceiveMessageData, User } from 'types/feishu';
import { createProcessMessageBody } from 'utils/db/helper';
import { getInternalTenantAccessToken, getUser, patchMessage, replyMessage } from 'utils/server/feishu';
import { OpenAIRequest, OpenAIStream } from 'utils/server/openai';

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
  recievedMessage
}: {
  airesult: string;
  question: string;
  feishuSender: User | null;
  promptTokens: number;
  completionTokens: number;
  app: App;
  recievedMessage: RecievedMessage;
}) => {
  let data = null;
  //@ts-ignore
  const feiShuMessageData = recievedMessage.data as ReceiveMessageData;
  if (airesult && airesult !== '') {
    data = createProcessMessageBody(
      question,
      airesult,
      feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous',
      feishuSender?.union_id || 'anonymous',
      promptTokens,
      completionTokens,
      app,
      feiShuMessageData.message.root_id || feiShuMessageData.message.message_id,
      feiShuMessageData.message.message_id
    );
  }

  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveProcesserResult`;
  await fetch(url, { method: 'POST', body: JSON.stringify({ feishuMessageId: feiShuMessageData.message.message_id, data }) });
};

const processMessage = async ({ recievedMessage, history, app }: MessageQueueBody) => {
  const appConfig = app.config as FeishuAppConfig;
  //@ts-ignore
  const feiShuMessageData = recievedMessage.data as ReceiveMessageData;

  const accessToken = (await (await getInternalTenantAccessToken(appConfig.appId, appConfig.appSecret)).json()).tenant_access_token;
  const question = JSON.parse(feiShuMessageData.message.content).text;
  // const chatId = feiShuMessageData.message.chat_id;
  // const chatType = feiShuMessageData.message.chat_type;
  // const senderType = feiShuMessageData.sender.sender_type;
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
    content: JSON.parse(feiShuMessageData.message.content).text
  };

  messages.push(message);

  //@ts-ignore
  let airesult: string = '';
  let completionTokens = 0;
  let feishuSender: User | null = null;
  if (feiShuMessageData.sender.sender_id?.union_id) {
    const u = await getFeishuUser(accessToken, feiShuMessageData.sender.sender_id.union_id);
    if (u) {
      feishuSender = u as User;
    }
  }

  const repliedMessageId = await trySendOrUpdateFeishuCard(accessToken, 'AI助理', '...', '回复中', null, recievedMessage.id, null);

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
        } else {
        }
      }
    },
    async (error) => {
      console.error(error);
      await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '错误中止', null, null, repliedMessageId);
      await finish({ airesult, question, feishuSender, promptTokens, completionTokens, app, recievedMessage });
    },
    async () => {
      // console.log(`enter finish , tokens: ${completionTokens}` )
      await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复完成', null, null, repliedMessageId);
      await finish({ airesult, question, feishuSender, promptTokens, completionTokens, app, recievedMessage });
    }
  );
  return openaiStream;
};

export { processMessage };

