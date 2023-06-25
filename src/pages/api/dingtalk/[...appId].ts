import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource, Message } from '@prisma/client';
import MessageQueue from 'pages/api/queues/messagesDingTalk';
import { MessageQueueBody, processMessage }  from 'processers/dingTalkBot';
import { NotFoundError } from '@prisma/client/runtime/library';
import  dingTalkSend  from 'pages/dingtalk/client';


const prisma = new PrismaClient();
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

const handleFeishuMessage = async (
  data: JSON,
  app: App & { aiResource: AIResource },
  res: NextApiResponse
) => {
  let recievedMessage = await prisma.recievedMessage.findUnique({ where: { id:  data.msgId} });
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
  recievedMessage = await prisma.recievedMessage.create({
    data: {
      id: data.msgId,
      appId: app.id,
      data: data,
      eventName: '',
      processing: true,
      type:"DINGTALK",
      createdAt: new Date(Number(data.createAt))
    }
  });

  let history: Message[] = [];

    history = await prisma.message.findMany({
      where: {
        conversationId: data.conversationId
      },
      orderBy: [
        {
          createdAt: 'desc'
        }
      ],
      take: 50
    });


  // Send to queue.
  // await MessageQueue.enqueue(
  //   { feishuMessage: feishuMessage, history: history, app: app }, // job to be enqueued
  //   { delay: 1 } // scheduling options
  // );
  const openaiStream = await processMessage({recievedMessage,history,app});
  res.end('ok');
};

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
      dingTalkSend(app,"Token已耗尽，请联系相关人员添加Token",data);
      return;
    }
    console.log(data);
    handleFeishuMessage(data,app,res);

  }else{
    res.end('ok');
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  handleRequest(req, res);
}
