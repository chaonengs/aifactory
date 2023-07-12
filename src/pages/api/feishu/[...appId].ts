import * as lark from '@larksuiteoapi/node-sdk';
import { AIResource, App, Message, Prisma, PrismaClient } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime/library';
import { ChatCommands, OpenAITemperature } from 'constant';
import { NextApiRequest, NextApiResponse } from 'next';
import MessageQueue from 'pages/api/queues/messages';
import { ReceiveMessageData, ReceiveMessageEvent } from 'types/feishu';
import { findSensitiveWords } from 'utils/db/transactions';

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
    encryptKey: config['encryptKey'] || config['appEncryptKey'],
    verificationToken: config['verificationToken'] || config['appVerificationToken'],
  }).register({
    'im.message.receive_v1': async (data) => {
      if (!app.aiResource) {
        const chatId = data.message.chat_id;
        const res = await client.im.message.reply({
          path: {
            message_id: data.message.message_id
          },
          data: {
            content: JSON.stringify({ text: '应用资源配置有误。' }),
            msg_type: 'text'
          }
        });
        return res;
      }
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

const handleFeishuMessage = async (
  client: lark.Client,
  event: ReceiveMessageEvent,
  app: App & { aiResource: AIResource },
  res: NextApiResponse
) => {
  let receivedMessage = await prisma.receivedMessage.findUnique({ where: { id: event.data.message.message_id } });
  if (receivedMessage?.processing) {
    res.status(400).end('messege in processing');
    return;
  }
  if (receivedMessage && !receivedMessage.processing) {
    res.end('ok');
    return;
  }
  const message = await prisma.message.findUnique({ where: { id: event.data.message.message_id } });
  if (message) {
    res.end('ok');
    return;
  }
  //根据群组id+用户id读取聊天会话信息
  let chatSession = await prisma.chatSession.findFirst({
    where: {
      groupId: event.data.message.chat_id,
      sender: event.data.sender.sender_id?.open_id
    }
  });
  //得到聊天会话对话样式
  if (chatSession && chatSession.temperature) {
    let temperature = chatSession.temperature;
    OpenAITemperature.forEach((item) => {
      if (item.key === temperature) {
        event.data.temperature = item.value;
      }
    })

  }

  receivedMessage = await prisma.receivedMessage.create({
    data: {
      id: event.data.message.message_id,
      appId: app.id,
      data: event.data,
      type: 'FEISHU',
      eventName: event.name,
      processing: true,
      createdAt: new Date(Number(event.data.message.create_time))
    }
  });

  //@ts-ignore
  const messageData = receivedMessage.data as ReceiveMessageData;
  const matched = await findSensitiveWords(JSON.parse(messageData.message.content).text, app.organizationId);


  let history: Message[] = [];
  if (event.data.message.root_id && event.data.message.root_id != event.data.message.message_id) {
    history = await prisma.message.findMany({
      where: {
        conversationId: event.data.message.root_id,
        isAIAnswer: true,
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 50
    });
  }

  // Send to queue.
  await MessageQueue.enqueue(
    { receivedMessage: receivedMessage, history: history, app: app, sensitiveWords: matched }, // job to be enqueued
    { delay: 1 } // scheduling options
  );



  res.end('ok');
};
/**
 * 根据内容判断是否为帮助模块，如果是则发送卡片消息
 * @param client 飞书客户端信息
 * @param event 消息内容
 * @param app 应用信息
 * @param res 
 * @returns 返回状态：true：代表是帮助，false:代表非帮助
 */
const chatSessionCard = async (
  client: lark.Client,
  event: ReceiveMessageEvent,
  app: App & { aiResource: AIResource },
  res: NextApiResponse
) => {
  if (app.config === null) {
    throw Error('App is not configed');
  }

  const config = app.config as Prisma.JsonObject;
  let helpStatus = false;
  let text = JSON.parse(event.data.message.content).text;
  // if (text.indexOf("@_user") != -1) {
  //   text = text.substr(8).trim();
  // }
  if (/@_user_\d/.test(text)) {
    text = text.replace(/@_user_\d/, '').trim();
  }
  //判断是否为帮助
  if (text === '/help' || text === '帮助') {
    let openId = event.data.sender.sender_id?.open_id || "";
    //根据群组和用户id读取聊天话题
    let chatSession = await prisma.chatSession.findUnique({
      where: {
        groupId_sender_appId: {
          groupId: event.data.message.chat_id,
          sender: openId,
          appId: app.id
        }
      }
    });
    let defaultSelectMenu = "";
    //读取对话样式，如果没有则显示默认值
    if (chatSession && chatSession.temperature) {

      let temperature = chatSession.temperature;
      OpenAITemperature.forEach((item) => {
        if (item.key === temperature) {
          defaultSelectMenu = item.text;
        }
      })
    } else {
      defaultSelectMenu = OpenAITemperature[0].text;
    }
    const record: Record<string, any> = {
      defaultSelectMenu: defaultSelectMenu,
      selectMenu: OpenAITemperature
    }
    let template_id = config['cardId'] as string;
    //飞书发送卡片消息
    const result = await client.im.message.createByCard({
      params: {
        receive_id_type: "chat_id"
      },
      data: {
        receive_id: event.data.message.chat_id,
        template_id: template_id,
        template_variable: record
      }
    });
    helpStatus = true;
  }
  return helpStatus;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { appId } = req.query;
  let id = null;
  if (Array.isArray(appId)) {
    id = appId[0];
  } else {
    id = appId;
  }
  if (!id) {
    res.status(404).end('not found');
    return;
  }

  let app;
  try {
    app = await findApp(id);
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      res.status(404).end('not found');
      return
    } else {
      throw e;
    }
  }

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

    const r = lark.generateChallenge(req.body, { encryptKey: config['appEncryptKey'] || config['encryptKey'] });
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

      const event = (await dispatcher.invoke(data)) as ReceiveMessageEvent;
      if (event.name === 'im.message.receive_v1' && ((event.data.message.chat_type === 'group' && event.data.message.mentions) || event.data.message.chat_type === 'p2p')) {
        //判断是不是帮助模块。是则发送卡片消息，不是则继续往下调用
        let helpStatus = await chatSessionCard(client, event, app, res);
        if (!helpStatus) {
          handleFeishuMessage(client, event, app, res);
        } else {
          res.end('ok');
        }

      } else {
        res.end('ok');
      }
    }
  }
};

