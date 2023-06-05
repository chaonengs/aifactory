// import { AIResource, App, FeiShuMessage } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai-streams/node';
import { ApiError } from 'next/dist/server/api-utils';

import { encode } from 'gpt-tokenizer';
import { createProcessMessageBody } from 'utils/db/helper';
// import * as lark from '@larksuiteoapi/node-sdk';
import { User } from 'types/feishu';
import Queue from 'pages/api/queues/fakedb';
import { getInternalTenantAccessToken, getUser, patchMessage, replyMessage, sendMessage } from 'utils/server/feishu';

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

const getFeishuUser = async (accessToken:string, userId: string) => {
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
    const repliedMessage = await (await replyMessage(
      accessToken,
      replayMessageId,
      {
        content: messageCard(title, message, status, error),
        msg_type: 'interactive'
      }
      
    )).json();

    //@ts-ignore
    if (repliedMessage.code > 0) {
      throw new ApiError(500, `code: ${repliedMessage.code} : ${repliedMessage.msg}`);
    }
    return repliedMessage.data?.message_id;
  }
  if (cardMessageId) {
    const updatedMessage = await (await patchMessage(accessToken, cardMessageId, {
      content: messageCard(title, message, status, error)
    },)).json();
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

const processFeishuMessage = async (feishuMessage, app) => {
  // const config = app.config as Prisma.JsonObject;
  // const client = new lark.Client({
  //   appId: config['appId'] as string,
  //   appSecret: config['appSecret'] as string,
  //   appType: lark.AppType.SelfBuild,
  //   domain: config['domain'] as string
  // });

  const accessToken = (await (await getInternalTenantAccessToken(app.config.appId, app.config.appSecret)).json()).tenant_access_token;

  //@ts-ignore
  const question = JSON.parse(feishuMessage.data.message.content).text;
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

  try {
    const stream = await OpenAI(
      'chat',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: question
          }
        ]
      },
      { apiKey: app.aiResource.apiKey, mode: 'tokens' }
    );
    const startedAt = Date.now();
    let lastSendAt = 0;

    for await (const chunk of stream) {
      const decoder = new TextDecoder();
      completionTokens += 1;
      if (airesult) {
        airesult += decoder.decode(chunk);
      } else {
        airesult = decoder.decode(chunk);
      }
      if (Date.now() - lastSendAt > 500) {
        trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复中', null, null, repliedMessageId);
        lastSendAt = Date.now();
      }
    }

    setTimeout(async () => {
      trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '回复完成', null, null, repliedMessageId);
    }, 500);
  } catch (err) {
    console.error(err);
    trySendOrUpdateFeishuCard(accessToken, 'AI助理', airesult, '错误中止', null, null, repliedMessageId);
  }

  if (airesult && airesult !== '') {
    const processMessageBody = createProcessMessageBody(
      question,
      airesult,
      feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous',
      feishuSender?.union_id || 'anonymous',
      encode(question).length,
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
