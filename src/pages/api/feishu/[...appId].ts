import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource } from '@prisma/client';
import * as lark from '@larksuiteoapi/node-sdk';
import { OpenAIChatComletion } from 'utils/server';
import { OpenAIModelID, OpenAIModels } from 'types/openai';
import { createMessage } from 'utils/db/transactions';
import { encode } from 'gpt-tokenizer';
import { OpenAI } from 'openai-streams/node';

const prisma = new PrismaClient();

const findApp = async (id: string) => {
  return await prisma.app.findUnique({
    where: {
      id
    },
    include: {
      aiResource: true
    }
  });
};

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

// const createMessage = async (feishuClient: lark.Client, feishuData: {}, app: App & { aiResource: AIResource }) => {
//   console.log(feishuData);
//   const messageJsonString = feishuData.message.content;
//   const message = JSON.parse(messageJsonString).text;
//   const aiResult = await (await OpenAIChatComletion(OpenAIModels[OpenAIModelID.GPT_3_5], message, 1, app.aiResource.apiKey, false)).json();
//   const feishuSender = await getFeishuUser(feishuClient, feishuData.sender.sender_id.union_id);
//   await prisma.$transaction([
//     prisma.message.create({
//       data: {
//         senderUnionId: feishuSender?.union_id as string,
//         sender: feishuSender?.name ? feishuSender.name : (feishuData.sender.sender_id.union_id as string),
//         content: message,
//         answer: aiResult.choices[0].message.content,
//         appId: app.id,
//         usage: {
//           create: {
//             aiResourceId: app.aiResourceId,
//             promptTokens: aiResult.usage.prompt_tokens as number,
//             completionTokens: aiResult.usage.completion_tokens as number,
//             totalTokens: aiResult.usage.total_tokens as number
//           }
//         }
//       }
//     }),
//     prisma.aIResource.update({
//       where: { id: app.aiResourceId },
//       data: {
//         tokenRemains: app.aiResource.tokenRemains - aiResult.usage.total_tokens,
//         tokenUsed: app.aiResource.tokenUsed + aiResult.usage.total_tokens
//       }
//     }),
//     prisma.app.update({
//       where: { id: app.id },
//       data: {
//         tokenUsed: app.tokenUsed + aiResult.usage.total_tokens
//       }
//     })
//   ]);

//   return aiResult.choices[0].message.content;
// };

const eventDispatcher = (app: App & { aiResource: AIResource }) => {
  if (app.config === null) {
    throw Error('App is not configed');
  }

  const config = app.config as Prisma.JsonObject;
  const client = new lark.Client({
    appId: config['appId'] as string,
    appSecret: config['appSecret'] as string,
    appType: lark.AppType.SelfBuild,
    domain: config['domain'] as string
  });
  return new lark.EventDispatcher({
    encryptKey: config['appEncryptKey'] as string,
    verificationToken: config['appVerificationToken'] as string
  }).register({
    'im.message.receive_v1': async (data) => {
      if (app.aiResource.tokenRemains <= 0) {
        const chatId = data.message.chat_id;
        const res = await client.im.message.create({
          params: {
            receive_id_type: 'chat_id'
          },
          data: {
            receive_id: chatId,
            content: JSON.stringify({ text: 'Token已耗尽，请联系相关人员添加Token' }),
            msg_type: 'text'
          }
        });
        return res;
      } else {
        return { name: 'im.message.receive_v1', data };
        JSON.parse(data.message.content).text
        const answer = await createMessage(client, data, app);
        const chatId = data.message.chat_id;
        const res = await client.im.message.create({
          params: {
            receive_id_type: 'chat_id'
          },
          data: {
            receive_id: chatId,
            content: JSON.stringify({ text: answer }),
            msg_type: 'text'
          }
        });
        return res;
      }
    }
  });
};

// const sendFeishuMessage()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { appId } = req.query;
  let id = null;
  if (Array.isArray(appId)) {
    id = appId[0];
  } else {
    id = appId;
  }
  if (id) {
    const app = await findApp(id);
    if (app === null) {
      res.status(404).end('not found');
    } else {
      if (req.body && req.body['type'] && req.body['type'] === 'url_verification') {
        res.end(JSON.stringify({ challenge: req.body['challenge'] }));
      } else if (req.body && req.body['encrypt']) {
        const config = app.config as Prisma.JsonObject;
        const client = new lark.Client({
          appId: config['appId'] as string,
          appSecret: config['appSecret'] as string,
          appType: lark.AppType.SelfBuild,
          domain: config['domain'] as string
        });

        const r = lark.generateChallenge(req.body, { encryptKey: config['appEncryptKey'] as string });
        if (r.isChallenge) {
          res.end(JSON.stringify(r.challenge));
        } else {
          const dispatcher = eventDispatcher(app);
          const data = Object.assign(
            Object.create({
              headers: req.headers
            }),
            req.body
          );

          console.log(data);

          const event = await dispatcher.invoke(data);
          if (event.name === 'im.message.receive_v1') {
            let sendresult = await client.im.message.create({
              params: {
                receive_id_type: 'chat_id'
              },
              data: {
                receive_id: event.data.message.chat_id,
                content: JSON.stringify({ text: '正在询问OPEN AI' }),
                msg_type: 'text'
              }
            });
            res.write(JSON.stringify(sendresult));
            const question =  JSON.parse(event.data.message.content).text;

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
              let airesult;
              let completionTokens = 0;
              stream.on('data', async (data) => {
                const decoder = new TextDecoder();
                completionTokens += 1;
                if (airesult) {
                    airesult += decoder.decode(data);
                } else {
                    airesult = decoder.decode(data);
                }
                await client.im.message.create({
                    params: {
                      receive_id_type: 'chat_id'
                    },
                    data: {
                      receive_id: event.data.message.chat_id,
                      content: JSON.stringify({ text: airesult }),
                      msg_type: 'text'
                    }
                  });
                res.write(airesult);
              });
              stream.on('end', async () => {
                const feishuSender = await getFeishuUser(client, event.data.sender.sender_id.union_id);
                await createMessage(question, airesult, feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous', feishuSender?.union_id || 'anonymous', encode(question).length, completionTokens, app);
                res.end();
              });
          }

          res.send('ok');
          //   res.end(result);
        }
      }
    }
  } else {
    res.status(404).end('not found');
  }
}
