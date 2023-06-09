import { ApiError } from 'next/dist/server/api-utils';

import { encode } from 'gpt-tokenizer';
import { createProcessMessageBody } from 'utils/db/helper';
import { User } from 'types/feishu';
import { getInternalTenantAccessToken, getUser, patchMessage, replyMessage, sendMessage, getChatHistory } from 'utils/server/feishu';
import { OpenAIRequest, OpenAIStream } from 'utils/server/openai';
import { OpenAIModelID, OpenAIModels } from 'types/openai';
import { Message, FeiShuMessage, App } from '.prisma/client/edge';

export type MessageQueueBody = {
    feishuMessage:FeiShuMessage;
    history: Message[];
    app: App;
  }

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

const finish = async ({ airesult, question, feishuSender, promptTokens, completionTokens, app, feishuMessage }) => {
  let data = null;
  if (airesult && airesult !== '') {
    data = createProcessMessageBody(
      question,
      airesult,
      feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous',
      feishuSender?.union_id || 'anonymous',
      promptTokens,
      completionTokens,
      app,
      feishuMessage.data.message.root_id || feishuMessage.data.message.message_id,
      feishuMessage.data.message.message_id,
    );
  }

  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveFeiShuResult`;
  await fetch(url, {method:'POST', body:JSON.stringify({feishuMessageId: feishuMessage.data.message.message_id, data})});
};

const processMessage = async ( { feishuMessage, history, app } : MessageQueueBody) => {
  const accessToken = (await (await getInternalTenantAccessToken(app.config.appId, app.config.appSecret)).json()).tenant_access_token;
  const question = JSON.parse(feishuMessage.data.message.content).text;
  const chatId = feishuMessage.data.message.chat_id;
  const chatType = feishuMessage.data.message.chat_type;
  const senderType = feishuMessage.data.sender.sender_type;
  const messages = new Array();
  let promptTokens = 0;

  for(let i = 0; i < history.length; i++){
    const answerMessage = {
      role: 'assistant',
      content: history[i].answer,
    }
    const answerTokens = encode(answerMessage.content).length;
    if(promptTokens + answerTokens > 2000) {
      break;
    }
    promptTokens += answerTokens;
    messages.unshift(answerMessage);

    const contentMessage = {
      role: 'user',
      content: history[i].content,
    }
    const conentTokens = encode(contentMessage.content).length;
    if(promptTokens + conentTokens > 2000) {
      break;
    }
    promptTokens += conentTokens;
    messages.unshift(contentMessage);
  }

  const message = {
    role: 'user',
    content: JSON.parse(feishuMessage.data.message.content).text,
  }

  messages.push(message);

  //@ts-ignore
  // const question = JSON.parse(feishuMessage.data.message.content).text;
  let airesult: string = '';
  let completionTokens = 0;
  let feishuSender: User | null | undefined = null;
  //@ts-ignore

  if (feishuMessage.data.sender.sender_id?.union_id) {
    //@ts-ignore

    const u = await getFeishuUser(accessToken, feishuMessage.data.sender.sender_id.union_id);
    if (u) {
      feishuSender = u as User;
    }
  }

  const repliedMessageId = await trySendOrUpdateFeishuCard(accessToken, 'AI助理', '...', '回复中', null, feishuMessage.id, null);

  let lastSendAt = 0;
  const params: OpenAIRequest = {
    model: OpenAIModels[OpenAIModelID.GPT_3_5],
    key: app.aiResource.apiKey,
    messages: messages,
  }
  const openaiStream = OpenAIStream(
    params,
    async (data) => {
      completionTokens += 1;
      if(data) {
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
      await finish({ airesult, question, feishuSender, promptTokens, completionTokens, app, feishuMessage });

    },
     async () => {
        // console.log(`enter finish , tokens: ${completionTokens}` )
        await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复完成', null, null, repliedMessageId);
        await finish({ airesult, question, feishuSender, promptTokens, completionTokens, app, feishuMessage });
      }
  );
  return openaiStream;
};

export { processMessage };
