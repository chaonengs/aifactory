import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource } from '@prisma/client';
import * as lark from '@larksuiteoapi/node-sdk';
import { createMessage } from 'utils/db/transactions';
import { encode } from 'gpt-tokenizer';
import { OpenAI } from 'openai-streams/node';
import { ReceiveMessageEvent, Sender, User } from 'types/feishu';
import { withFireAndForget } from 'utils/handlers';
import  MessageQueue  from "pages/api/queues/messages";

const prisma = new PrismaClient();

const findApp = async (id: string) => {
  return await prisma.app.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      aiResource: true
    }
  });
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
        const res = await client.im.message.reply({
          path: {
            message_id: data.message.message_id
          },
          data: {
            content: JSON.stringify({ text: 'Token已耗尽，请联系相关人员添加Token' }),
            msg_type: 'text'
          }
        });
        return res;
      } else {
        return { name: 'im.message.receive_v1', data };
      }
    }
  });
};



// const sendFeishuMessage()

const processFeishuMessage = async (messageId:string) => {
  const feishuMessage = await prisma.feiShuMessage.findUniqueOrThrow({where:{id:messageId}});
  const app = await findApp(feishuMessage.appId);
  const config = app.config as Prisma.JsonObject;
  const client = new lark.Client({
    appId: config['appId'] as string,
    appSecret: config['appSecret'] as string,
    appType: lark.AppType.SelfBuild,
    domain: config['domain'] as string
  });

  const sendResult = await client.im.message.reply({
    path: {
        message_id: messageId
        },
      data: {
      content: messageCard('正在询问OpenAI', '...'),
      msg_type: 'interactive'
      }
  });

  const question =  JSON.parse(feishuMessage.data.message.content).text;
    let airesult:string = '';
    let completionTokens = 0;
    let feishuSender: User | null | undefined = null;
    if(feishuMessage.data.sender.sender_id?.union_id){
        const u =   await getFeishuUser(client, feishuMessage.data.sender.sender_id.union_id)
        if(u){
            feishuSender = u as User;
        }
    }
    try{
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

        stream.on('data', async (data) => {
            const decoder = new TextDecoder();
            completionTokens += 1;
            if (airesult) {
                airesult += decoder.decode(data);
            } else {
                airesult = decoder.decode(data);
            }
            if(completionTokens % 5 === 0){
                const cardResult = await client.im.message.patch({
                    path: {
                    message_id: sendResult.data?.message_id as string
                    },
                    data: {
                    content: messageCard('回复中', airesult),
                    }
                });
            }
        });

        stream.on('end', async () => {
            const cardResult = await client.im.message.patch({
                path: {
                message_id: sendResult.data?.message_id as string
                },
                data: {
                content: messageCard('回复结束', airesult),
                }
            });

            await createMessage(question, airesult, feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous', feishuSender?.union_id || 'anonymous', encode(question).length, completionTokens, app);
            await prisma.feiShuMessage.update({
                where: { id: messageId },
                data: {
                    processing: false
                }
            });
        });
      } catch (error)
      {
          console.error(error);
          await client.im.message.patch({
              path: {
              message_id: sendresult.data?.message_id as string
              },
              data: {
              content: messageCard('未正常响应',airesult, '出现错误，请稍后再试'),
              }
          });
          if(airesult && airesult !== ''){
              await createMessage(question, airesult, feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous', feishuSender?.union_id || 'anonymous', encode(question).length, completionTokens, app);
          }
          await prisma.feiShuMessage.update({
            where: { id: messageId },
            data: {
                processing: false
            }
        });
      }

}

const handleFeishuMessage = async (client:lark.Client, event:ReceiveMessageEvent, app: App & { aiResource: AIResource }, res:NextApiResponse) => {
    const feishuMessage = await prisma.feiShuMessage.findUnique({where:{id:event.data.message.message_id}});
    if(feishuMessage?.processing){
        res.status(400).end('messege in processing');
        return
    }
    if(feishuMessage && !feishuMessage.processing){
        res.end('ok');
        return
    }
    const message = await prisma.message.findUnique({where: {id:event.data.message.message_id}});
    if(message){
      res.end('ok');
      return;
    }
    await prisma.feiShuMessage.create({data:{
      id: event.data.message.message_id,
      appId: app.id,
      //@ts-ignore
      content: event.data as Prisma.JsonObject,
      eventName: event.name,
      processing: true,
      createdAt: new Date(Number(event.data.message.create_time)),
    }})

    
    await MessageQueue.enqueue(
      messageId, // job to be enqueued
      { delay: "1s" } // scheduling options
    )

    res.end('ok')

}

const handleRequest = async (req: NextApiRequest, res: NextApiResponse) => {const { appId } = req.query;
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
          console.log(data.headers);
          const event = await dispatcher.invoke(data) as ReceiveMessageEvent;
          if (event.name === 'im.message.receive_v1') {
            handleFeishuMessage(client,event,app, res);
          }

          else {
            res.end('ok')
          }
          //   res.end(result);
        }
      }
    }
  } else {
    res.status(404).end('not found');
  }
  
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  handleRequest(req, res);
}
