import { ApiError } from 'next/dist/server/api-utils';

import { encode } from 'gpt-tokenizer';
import { createProcessMessageBody } from 'utils/db/helper';
import { ReceiveMessageData } from 'types/feishu';
import saveDingTalkResult from "pages/api/db/saveDingTalkResult";
import { getInternalTenantAccessToken, getUser, patchMessage, replyMessage, sendMessage, getChatHistory } from 'utils/server/feishu';
import { OpenAIRequest, OpenAIStream } from 'utils/server/openai';
import { OpenAIModelID, OpenAIModels } from 'types/openai';
import { Message, RecievedMessage, App } from '.prisma/client/edge';
import { AppConfig } from 'types/app';
import DingTalk from 'pages/dingtalk/client';
import { MessageQueueBody } from 'pages/api/queues/messages';


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
  promptTokens,
  completionTokens,
  app,
  recievedMessage
}: {
  airesult: string;
  question: string;
  promptTokens: number;
  completionTokens: number;
  app: App;
  recievedMessage: RecievedMessage;
}) => {
  let data = null;
  //@ts-ignore
  const feiShuMessageData = recievedMessage.data ;
  if (airesult && airesult !== '') {
    data = createProcessMessageBody(
      question,
      airesult,
      feiShuMessageData?.senderNick || 'anonymous',
      feiShuMessageData?.senderStaffId || 'anonymous',
      promptTokens,
      completionTokens,
      app,
      feiShuMessageData.conversationId,
      feiShuMessageData.msgId
    );
  }

  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveDingTalkResult`;
  const body=JSON.stringify({ feishuMessageId: feiShuMessageData.msgId, data }) ;
  await fetch(url, { method: 'POST', body:body});
  // const json={
  //   feishuMessageId: feiShuMessageData.msgId, 
  //   data: data 
  // };
  // saveFeiShuResult(json);
};

const processMessage = async ({ recievedMessage, history, app }: MessageQueueBody) => {
  const appConfig = app.config as AppConfig;
  //@ts-ignore
  const feiShuMessageData = recievedMessage.data as ReceiveMessageData;
  const question = feiShuMessageData.text.content;
  const messages = new Array();
  let promptTokens = 0;

  for (let i = 0; i < history.length; i++) {
    const answerMessage = {
      role: 'assistant',
      content: history[i].answer
    };
    const answerTokens = encode(answerMessage.content).length;
    if (promptTokens + answerTokens > appConfig.ai.maxPromptTokens) {
      break;
    }
    promptTokens += answerTokens;
    messages.unshift(answerMessage);

    const contentMessage = {
      role: 'user',
      content: history[i].content
    };
    const conentTokens = encode(contentMessage.content).length;
    if (promptTokens + conentTokens > appConfig.ai.maxPromptTokens) {
      break;
    }
    promptTokens += conentTokens;
    messages.unshift(contentMessage);
  }

  const message = {
    role: 'user',
    content: question
  };

  messages.push(message);

  //@ts-ignore
  // const question = JSON.parse(feishuMessage.data.message.content).text;
  let airesult: string='';
  let completionTokens = 0;
  const params: OpenAIRequest = {
    model: OpenAIModels[OpenAIModelID.GPT_3_5],
    messages: messages,
    key: app.aiResource.apiKey,
    type: app.aiResource.type,
    hostUrl:app.aiResource.hostUrl
  };
  const openaiStream = OpenAIStream(
    params,
    async (data) => {
      completionTokens += 1;
      if (data) {
        airesult += data;
      }
    },
    async (error) => {
      console.error(error);

      await finish({ airesult, question, promptTokens, completionTokens, app, recievedMessage });
    },
    async () => {
      await DingTalk(app,airesult,recievedMessage.data);
      await finish({ airesult, question, promptTokens, completionTokens, app, recievedMessage });
    }
  );
  return openaiStream;
};



export { processMessage };
