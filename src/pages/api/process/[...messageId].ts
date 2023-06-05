import { AIResource, App, Prisma, PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai-streams/node';
import { ApiError } from 'next/dist/server/api-utils';

import { encode } from 'gpt-tokenizer';
import { createMessage } from 'utils/db/transactions';
import * as lark from '@larksuiteoapi/node-sdk';
import { User } from 'types/feishu';
import { send } from 'process';

const prisma = new PrismaClient();

const getFeishuUser = async (client: lark.Client, userId: string) => {
  const req = {
    user_id_type: 'union_id',
    department_id_type: ''
  };
  const res = await client.contact.user.get({
    params: {
      user_id_type: 'union_id',
      department_id_type: 'department_id'
    },
    path: {
      user_id: userId
    }
  });
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
      },
    ],
    header: {
      template: status === '回复中' ? 'green' : (status === '回复完成' ? 'blue' : status === '错误中止' ? 'red' : 'blue' ),
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

const trySendOrUpdateFeishuCard = async (client:lark.Client, title:string, message:string, status:string, error:string|null, replayMessageId:string|null, cardMessageId:string|null) =>{
  if (replayMessageId){
    const repliedMessage = await client.im.message.reply({
      path: {
        message_id: replayMessageId
      },
      data: {
        content: messageCard(title, message, status, error),
        msg_type: 'interactive'
      }
    });
  
    //@ts-ignore
    if (repliedMessage.code > 0) {
      throw new ApiError(500, `code: ${repliedMessage.code} : ${repliedMessage.msg}`);
    }
    return repliedMessage.data?.message_id;
  }
  if (cardMessageId){
    const updatedMessage = await client.im.message.patch({
      path: {
        message_id: cardMessageId
      },
      data: {
        content: messageCard(title, message, status, error),
      }
    });

    //@ts-ignore
    if (repliedMessage.code > 0) {
      throw new ApiError(500, `code: ${updatedMessage.code} : ${updatedMessage.msg}`);
    }
    return updatedMessage.data;
  }

}

const processFeishuMessage = async (messageId: string) => {
  const feishuMessage = await prisma.feiShuMessage.findUniqueOrThrow({ where: { id: messageId } });
  const app = await prisma.app.findUniqueOrThrow({
    where: {
      id: feishuMessage.appId
    },
    include: {
      aiResource: true
    }
  });
  const config = app.config as Prisma.JsonObject;
  const client = new lark.Client({
    appId: config['appId'] as string,
    appSecret: config['appSecret'] as string,
    appType: lark.AppType.SelfBuild,
    domain: config['domain'] as string
  });


  //@ts-ignore
  const question = JSON.parse(feishuMessage.data.message.content).text;
  let airesult: string = '';
  let completionTokens = 0;
  let feishuSender: User | null | undefined = null;
    //@ts-ignore

  if (feishuMessage.data.sender.sender_id?.union_id) {
      //@ts-ignore

    const u = await getFeishuUser(client, feishuMessage.data.sender.sender_id.union_id);
    if (u) {
      feishuSender = u as User;
    }
  }

  const repliedMessageId = await trySendOrUpdateFeishuCard(client, 'AI助理', '...', '回复中', null, messageId, null);

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
        trySendOrUpdateFeishuCard(client, 'AI助理', airesult, '回复中', null, null, repliedMessageId);
      }
    }

    setTimeout(async () => {
      trySendOrUpdateFeishuCard(client, 'AI助理', airesult, '回复完成', null, null, repliedMessageId);
    }, 500);
  } catch (err) {
    console.error(err);
    trySendOrUpdateFeishuCard(client, 'AI助理', airesult, '错误中止', null, null, repliedMessageId);
  }

  if (airesult && airesult !== '') {
    await createMessage(
      question,
      airesult,
      feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous',
      feishuSender?.union_id || 'anonymous',
      encode(question).length,
      completionTokens,
      app
    );
  }
  await prisma.feiShuMessage.update({
    where: { id: messageId },
    data: {
      processing: false
    }
  });
};

// console.log(airesult)
// stream.on('data', async (data) => {
//     const decoder = new TextDecoder();
//     completionTokens += 1;
//     if (airesult) {
//         airesult += decoder.decode(data);
//     } else {
//         airesult = decoder.decode(data);
//     }
//     if(completionTokens % 10 === 0){
//         const cardResult = await client.im.message.patch({
//             path: {
//             message_id: repliedMessage.data?.message_id as string
//             },
//             data: {
//             content: messageCard('回复中', airesult),
//             }
//         });
//     }
// });

// stream.on('end', async () => {
//   setTimeout(async () => {
//     const cardResult = await client.im.message.patch({
//       path: {
//       message_id: repliedMessage.data?.message_id as string
//       },
//       data: {
//       content: messageCard('回复结束', airesult),
//       }
//   });
//   }, 1000);

//     await createMessage(question, airesult, feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous', feishuSender?.union_id || 'anonymous', encode(question).length, completionTokens, app);
//     await prisma.feiShuMessage.update({
//         where: { id: messageId },
//         data: {
//             processing: false
//         }
//     });
// });

// } catch (error)
// {
//     console.error(error);
//     await client.im.message.patch({
//         path: {
//         message_id: repliedMessage.data?.message_id as string
//         },
//         data: {
//         content: messageCard('未正常响应',airesult, '出现错误，请稍后再试'),
//         }
//     });
//     if(airesult && airesult !== ''){
//         await createMessage(question, airesult, feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous', feishuSender?.union_id || 'anonymous', encode(question).length, completionTokens, app);
//     }
//     await prisma.feiShuMessage.update({
//       where: { id: messageId },
//       data: {
//           processing: false
//       }
//   });
// }

// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messageId } = req.query;
  let id = null;
  if (Array.isArray(messageId)) {
    id = messageId[0];
  } else {
    id = messageId;
  }

  await processFeishuMessage(id as string);
  res.end('ok');
}

export { processFeishuMessage };
