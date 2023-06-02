import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource } from '@prisma/client';
import * as lark from '@larksuiteoapi/node-sdk';
import { chat, createConfiguration } from 'utils/server/openai';
import { OpenAIChatComletion } from 'utils/server';
import { OpenAIModelID, OpenAIModels } from 'types/openai';

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

const createMessage = async (feishuClient: lark.Client, feishuData: {}, app: App & { aiResource: AIResource }) => {
    console.log(feishuData);
  const message = feishuData.message.content;
  const aiResult = await (await OpenAIChatComletion(OpenAIModels[OpenAIModelID.GPT_3_5], message, 1, app.aiResource.apiKey, false)).json()
  const feishuSender = await getFeishuUser(feishuClient, feishuData.sender.sender_id.union_id);
  await prisma.$transaction([
    prisma.message.create({
        data:{
            senderUnionId: feishuSender?.union_id as string,
            sender: feishuSender?.name ? feishuSender.name : (feishuData.sender.sender_id.union_id as string),
            content: message,
            answer: aiResult.choices[0].message.content,
            appId: app.id,
            usage: {
                create:{
                aiResourceId: app.aiResourceId,
                promptTokens: aiResult.usage.prompt_tokens as number,
                completionTokens: aiResult.usage.completion_tokens as number,
                totalTokens: aiResult.usage.total_tokens as number
            }
          }
        }
      }),
    prisma.aIResource.update({
      where: { id: app.aiResourceId },
      data: {
        tokenRemains: app.aiResource.tokenRemains - aiResult.usage.total_tokens,
        tokenUsed: app.aiResource.tokenUsed + aiResult.usage.total_tokens
      }
    }),
    prisma.app.update({
      where: { id: app.id },
      data: {
        tokenUsed: app.tokenUsed + aiResult.usage.total_tokens
      }
    })
  ]);

  return aiResult.choices[0].message.content;
};

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
        console.log(req.body['encrypt']);
        const r = lark.generateChallenge(req.body, { encryptKey: app.config['appEncryptKey'] });
        if (r.isChallenge) {
          res.end(JSON.stringify(r.challenge));
        } else {
          const dispatcher = eventDispatcher(app);
          const data = Object.assign(Object.create({
            headers: req.headers,
        }), req.body);
          const result = await dispatcher.invoke(data);
          res.end(result);
        }
      }
    }
  } else {
    res.status(404).end('not found');
  }
}
