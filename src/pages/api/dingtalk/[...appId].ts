import { AIResource, App, Message, PrismaClient } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime/library';
import { ChatModeDateTime, ChatModeTypes } from 'constant';
import { NextApiRequest, NextApiResponse } from 'next';
import MessageQueue from 'pages/api/queues/messages';
import dingTalkSend from 'utils/dingtalk/client';


const prisma = new PrismaClient({
  log: ['query']
});
/* 
  读取APP表下应用信息
*/
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
/**
 * 确认消息信息，根据情况获取历史消息，然后发送给队列
 * @param data 钉钉消息体
 * @param app 应用id
 * @param res 
 * @returns 
 */
const handleDingTalkMessage = async (
  data: JSON,
  app: App & { aiResource: AIResource },
  res: NextApiResponse
) => {

  let receivedMessage = await prisma.receivedMessage.findUnique({ where: { id: data.msgId } });
  if (receivedMessage?.processing) {
    res.status(400).end('messege in processing');
    return;
  }
  if (receivedMessage && !receivedMessage.processing) {
    res.end('ok');
    return;
  }
  const message = await prisma.message.findUnique({ where: { id: data.msgId } });
  if (message) {
    res.end('ok');
    return;
  }


  let history: Message[] = [];
  let unionMessageId = null;
  //读取是否存在串聊上下文unionMessageId
  const unionMessage = await unionMessagefindBy({ appId: app.id, organizationId: data.organizationId, conversationId: data.conversationId });
  //如果存在上下文unionMessageId 并且type类型为串聊，则获取改unionMessageId下历史消息
  if (unionMessage && unionMessage.unionMessageId && unionMessage.type === 2) {
    unionMessageId = unionMessage.unionMessageId;
    history = await prisma.message.findMany({
      where: {
        conversationId: unionMessageId
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 50
    });

  }
  //将unionMessageId 写入到data数据体中，给后续使用
  data.unionMessageId = unionMessageId || data.msgId;
  //写入数据
  receivedMessage = await prisma.receivedMessage.create({

    data: {
      id: data.msgId,
      appId: app.id,
      data: data,
      eventName: '',
      processing: true,
      type: "DINGTALK",
      createdAt: new Date(Number(data.createAt))
    }
  });

  //Send to queue.
  await MessageQueue.enqueue(
    { recievedMessage: recievedMessage, history: history, app: app }, // job to be enqueued
    { delay: 1 } // scheduling options
  );
  //const openaiStream = await processMessage({recievedMessage,history,app});
  res.end('ok');
};
/**
 * 根据内容获取unionMessage 是否存在上下文信息，如果存在则返回unionMessageId 和type 如果没有在type=1
 * @param data 内容体包含：appId,organizationId,conversationId
 * @returns 返回 json 例如：{"unionMessageId:****","type":1}
 */
const unionMessagefindBy = async (data: JSON) => {
  let datetime = new Date()
  let unionMessage = await prisma.unionMessage.findMany({
    where: {
      appId: data.appId,
      organizationId: data.organizationId,
      conversationId: data.conversationId,

      createdAt: {
        lt: datetime
      },
      expiringDate: {
        gt: datetime
      }
    },
    orderBy: [
      {
        createdAt: 'desc'
      }
    ], take: 1
  });
  let unionMessageId = null;
  let type = 1;
  if (unionMessage.length != 0 && unionMessage[0].id) {
    type = unionMessage[0].conversationType;
    unionMessageId = unionMessage[0].id;
  }
  return { unionMessageId: unionMessageId, type: type }
}
/**
 * 聊天模板消息模块，判断是否为特定字符串如果是则做相应返回和生成上线文ID
 * @param data 钉钉消息内容体
 * @param app 应用
 * @param res 
 * @returns 返回状态：true:代表没有在模板中，false:在模板中
 */
const chatModeMessage = async (
  data: JSON,
  app: App & { aiResource: AIResource },
  res: NextApiResponse
) => {
  let unionMessage = null;
  let type = null;
  let status = true;
  let content=data.text.content.trim();
  //循环遍历模块类型，发送钉钉消息
  ChatModeTypes.forEach((item, index, array) => {

    if (item.name === content) {
      status = false;
      const message = item.message.replace("#name", data.senderNick);
      const messageBody = message.replace("#time", ChatModeDateTime);
      dingTalkSend(app, messageBody, data);
      if (item.type) {
        type = item.type;
      }
    }
  });
  //type 存在则表明为：单聊、串聊、重置
  if (type) {
    //如果为重置则获取原有type类型是单聊还是串聊。默认是单聊
    if (type == 3) {
      const unionMessage = await unionMessagefindBy({ appId: app.id, organizationId: app.organizationId, conversationId: data.conversationId });
      if (unionMessage && unionMessage.type) {
        type = unionMessage.type;
      }
    }
    //写入数据库，限定时间：ChatModeDateTime
    let datetime = new Date();
    let expiringDate = new Date(Date.now() + ChatModeDateTime * 60000);
    unionMessage = await prisma.unionMessage.create({
      data: {
        createdAt: datetime,
        expiringDate: expiringDate,
        sender: data.senderStaffId,
        appId: app.id,
        organizationId: app.organizationId,
        conversationId: data.conversationId,
        conversationType: type
      }
    });
  }
  return status;
}


const handleRequest = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.body && req.body['msgtype'] && req.body['msgtype'] == 'text') {
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


    const data = Object.assign(
      Object.create({
        headers: req.headers
      }),
      req.body
    );
    if (app.aiResource && app.aiResource.tokenRemains <= 0) {
      dingTalkSend(app, "Token已耗尽，请联系相关人员添加Token", data);
      return;
    }
    //console.log(data);
    const unionStatus = await chatModeMessage(data, app, res);
    if (unionStatus) {
      handleDingTalkMessage(data, app, res);
    }


  } else {
    res.end('ok');
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  handleRequest(req, res);
}
