// import { AIResource, App, FeiShuMessage } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai-streams/node';
import { ApiError } from 'next/dist/server/api-utils';

import { encode } from 'gpt-tokenizer';
import { createProcessMessageBody } from 'utils/db/helper';
// import * as lark from '@larksuiteoapi/node-sdk';
import { User } from 'types/feishu';
import Queue from 'pages/api/queues/fakedb';
import { getInternalTenantAccessToken, getUser, patchMessage, replyMessage, sendMessage, getChatHistory } from 'utils/server/feishu';
import { OpenAIStream } from 'utils/server/openai';
import { OpenAIModelID, OpenAIModels } from 'types/openai';

// const prisma = new PrismaClient();

// const getFeishuUser = async (client: lark.Client, userId: string) => {
//   const req = {
//     user_id_type: 'union_id',
//     department_id_type: ''
//   };
//   const res = await client.contact.user.get({
//     params: {
//       user_id_type: 'union_id',
//       department_id_type: 'department_id'
//     },
//     path: {
//       user_id: userId
//     }
//   });
//   return res.data?.user;
// };

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

// const trySendOrUpdateFeishuCard = async (client:lark.Client, title:string, message:string, status:string, error:string|null, replayMessageId:string|null, cardMessageId:string|null) =>{
//   if (replayMessageId){
//     const repliedMessage = await client.im.message.reply({
//       path: {
//         message_id: replayMessageId
//       },
//       data: {
//         content: messageCard(title, message, status, error),
//         msg_type: 'interactive'
//       }
//     });

//     //@ts-ignore
//     if (repliedMessage.code > 0) {
//       throw new ApiError(500, `code: ${repliedMessage.code} : ${repliedMessage.msg}`);
//     }
//     return repliedMessage.data?.message_id;
//   }
//   if (cardMessageId){
//     const updatedMessage = await client.im.message.patch({
//       path: {
//         message_id: cardMessageId
//       },
//       data: {
//         content: messageCard(title, message, status, error),
//       }
//     });

//     //@ts-ignore
//     if (updatedMessage.code > 0) {
//       throw new ApiError(500, `code: ${updatedMessage.code} : ${updatedMessage.msg}`);
//     }
//     return updatedMessage.data;
//   }

// }

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

// const processFeishuMessageById = async (messageId: string) => {
//   const feishuMessage = await prisma.feiShuMessage.findUniqueOrThrow({ where: { id: messageId } });
//   const app = await prisma.app.findUniqueOrThrow({
//     where: {
//       id: feishuMessage.appId
//     },
//     include: {
//       aiResource: true
//     }
//   });

//     const config = app.config as Prisma.JsonObject;
//   const client = new lark.Client({
//     appId: config['appId'] as string,
//     appSecret: config['appSecret'] as string,
//     appType: lark.AppType.SelfBuild,
//     domain: config['domain'] as string
//   });
//   const accessToken = await client.tokenManager.getTenantAccessToken();
//   return processFeishuMessage(feishuMessage, app);
// };

const completeQuery = async ({ airesult, question, feishuSender, promptTokens, completionTokens, app, feishuMessage }) => {
  if (airesult && airesult !== '') {
    const processMessageBody = createProcessMessageBody(
      question,
      airesult,
      feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous',
      feishuSender?.union_id || 'anonymous',
      promptTokens,
      completionTokens,
      app
    );

    await Queue.enqueue(
      {
        type: 'save',
        data: processMessageBody,
        feishuMessageId: null
      },
      { delay: 1 }
    );
  }

  await Queue.enqueue(
    {
      type: 'finish',
      data: null,
      feishuMessageId: feishuMessage.id
    },
    { delay: 1 }
  );
};

const processFeishuMessage = async (feishuMessage, app) => {
  // const config = app.config as Prisma.JsonObject;
  // const client = new lark.Client({
  //   appId: config['appId'] as string,
  //   appSecret: config['appSecret'] as string,
  //   appType: lark.AppType.SelfBuild,
  //   domain: config['domain'] as string
  // });

  const accessToken = (await (await getInternalTenantAccessToken(app.config.appId, app.config.appSecret)).json()).tenant_access_token;
  const question = JSON.parse(feishuMessage.data.message.content).text;
  const chatId = feishuMessage.data.message.chat_id;
  const chatType = feishuMessage.data.messsage.chat_type;
  const senderType = feishuMessage.data.sender.sender_type;
  const messages = new Array();
  let promptTokens = 0;
  if(chatType === 'group'){
    const chatHistory = (await(await getChatHistory(accessToken, chatId)).json()).data.items;
    for(let i = 0; i < chatHistory.length; i++){
      const text = JSON.parse(chatHistory[i].body.content).text;
      const textTokens = encode(text).length;
      if(promptTokens + textTokens > 2000){
        break;
      } else {
        promptTokens += textTokens;
        const message = {
          role: chatHistory[i].sender.sender_type === 'app' ? 'assistant' : 'user',
          content: text,
        }
        messages.unshift(message);
      }
    }
  }
  if (chatType === 'p2p'){
    const text = JSON.parse(feishuMessage.data.message.content).text;
    const textTokens = encode(text).length;
    promptTokens += textTokens;
    const message = {
      role: 'user',
      content: text,
    }
    messages.unshift(message);
  }



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

  const startedAt = Date.now();
  let lastSendAt = 0;
  const openaiStream = OpenAIStream(
    OpenAIModels[OpenAIModelID.GPT_3_5],
    '',
    1,
    app.aiResource.apiKey,
    messages,
    async (data) => {
      completionTokens += 1;
      if(data) {
      airesult += data;
        if (Date.now() - lastSendAt > 750) {
          // console.log(`will send ${Date.now()} , tokens: ${completionTokens}` )
          const result = await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复中', null, null, repliedMessageId);
          lastSendAt = Date.now();
          // console.log(`sended ${Date.now()} , tokens: ${completionTokens}` )

        } else {
          // console.log(`skipped ${Date.now()}, tokens: ${completionTokens}` )
        }
      }
    },
    async (error) => {
      console.error(error);
      await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '错误中止', null, null, repliedMessageId);
      await completeQuery({ airesult, question, feishuSender, promptTokens, completionTokens, app, feishuMessage });

    },
     async () => {
        // console.log(`enter finish , tokens: ${completionTokens}` )
        await trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复完成', null, null, repliedMessageId);
        await completeQuery({ airesult, question, feishuSender, promptTokens, completionTokens, app, feishuMessage });
      }
  );

  return openaiStream;
  
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // const { messageId } = req.query;
  // let id = null;
  // if (Array.isArray(messageId)) {
  //   id = messageId[0];
  // } else {
  //   id = messageId;
  // }

  // await processFeishuMessageById(id as string);
  // req.headers
  res.end('ok');
}

export { processFeishuMessage };
