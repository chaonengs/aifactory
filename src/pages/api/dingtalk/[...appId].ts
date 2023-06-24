import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource, Message } from '@prisma/client';
import MessageQueue from 'pages/api/queues/messagesDingTalk';
import { MessageQueueBody, processMessage }  from 'processers/dingTalkBot';
import { NotFoundError } from '@prisma/client/runtime/library';


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
  let feishuMessage = await prisma.feiShuMessage.findUnique({ where: { id:  data.msgId} });
  if (feishuMessage?.processing) {
    res.status(400).end('messege in processing');
    return;
  }
  if (feishuMessage && !feishuMessage.processing) {
    res.end('ok');
    return;
  }
  const message = await prisma.message.findUnique({ where: { id: data.msgId } });
  if (message) {
    res.end('ok');
    return;
  }
  feishuMessage = await prisma.feiShuMessage.create({
    data: {
      id: data.msgId,
      appId: app.id,
      data: data,
      eventName: '',
      processing: true,
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
  const openaiStream = await processMessage({feishuMessage,history,app});
  res.end('ok');
};

const handleRequest = async (req: NextApiRequest, res: NextApiResponse) => {
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

  if (req.body && req.body['msgtype'] && req.body['msgtype'] == 'text') {
    const config = app.config as Prisma.JsonObject;
    // const message="消息收到";
    // const dingTalk= DingTalk(app,message);

    const data = Object.assign(
      Object.create({
        headers: req.headers
      }),
      req.body
    );
    console.log(data);
    handleFeishuMessage(data,app,res);

  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  handleRequest(req, res);
}
