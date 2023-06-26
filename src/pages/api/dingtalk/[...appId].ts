import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource, Message, UnionMessage } from '@prisma/client';
import MessageQueue from 'pages/api/queues/messages';
import { NotFoundError } from '@prisma/client/runtime/library';
import dingTalkSend from 'utils/dingtalk/client';
import { ChatModeTypes, ChatModeDateTime } from 'constant'


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

const handleDingTalkMessage = async (
  data: JSON,
  app: App & { aiResource: AIResource },
  res: NextApiResponse
) => {
  let recievedMessage = await prisma.recievedMessage.findUnique({ where: { id: data.msgId } });
  if (recievedMessage?.processing) {
    res.status(400).end('messege in processing');
    return;
  }
  if (recievedMessage && !recievedMessage.processing) {
    res.end('ok');
    return;
  }
  const message = await prisma.message.findUnique({ where: { id: data.msgId } });
  if (message) {
    res.end('ok');
    return;
  }
  let datetime = new Date()
  let unionMessage = await prisma.unionMessage.findMany({
    where: {
      appId: app.id,
      organizationId: app.organizationId,
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

  let history: Message[] = [];
  let unionMessageId = null;
  if (unionMessage.length!=0 && unionMessage[0].id && unionMessage[0].conversationType === 2) {
    unionMessageId = unionMessage[0].id;
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

  recievedMessage = await prisma.recievedMessage.create({
    data: {
      id: data.msgId,
      appId: app.id,
      data: data,
      eventName: '',
      processing: true,
      type: "DINGTALK",
      createdAt: datetime
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

const chatModeMessage = async (
  data: JSON,
  app: App & { aiResource: AIResource },
  res: NextApiResponse
) => {
  let unionMessage = null;
  let type = null;
  let status = true;
  ChatModeTypes.forEach((item, index, array) => {

    if (item.name === data.text.content) {
      status = false;
      const message = item.message.replace("#name", data.senderNick);
      dingTalkSend(app, message, data);
      if (item.type) {
        type = item.type;
      }
    }
  });
  if (type) {
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
