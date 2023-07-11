import { AIResource, App, ChatSession, Message, PrismaClient } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime/library';
import { ChatModeDateTime, ChatModeTypes, chatTemplate } from 'constant';
import { randomUUID } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import MessageQueue from 'pages/api/queues/messages';
import dingTalkSend from 'utils/dingtalk/client';
import { findSensitiveWords } from 'utils/db/transactions';


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
  res: NextApiResponse,
  token: String
) => {

  //获取当前消息是否存在，判断消息状态。
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
  const chatSession = await chatSessionfindBy({ groupId: data.conversationId, sender: data.senderStaffId });
  //如果存在上下文unionMessageId 并且type类型为串聊，则获取改unionMessageId下历史消息
  if (chatSession && chatSession.status && chatSession.conversationId && chatSession.type === 'MUITIWHEEL') {
    unionMessageId = chatSession.conversationId;
    history = await prisma.message.findMany({
      where: {
        conversationId: unionMessageId,
        isAIAnswer: true
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
  data.token = token;
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
  //敏感词
  const matched = await findSensitiveWords(data.text.content, app.organizationId);

  //Send to queue.
  await MessageQueue.enqueue(
    { receivedMessage: receivedMessage, history: history, app: app, sensitiveWords: matched }, // job to be enqueued
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
const chatSessionfindBy = async (data: JSON) => {
  let datetime = Number(new Date(new Date().toISOString()))
  let chatSession = await prisma.chatSession.findFirst({
    where: {
      groupId: data.groupId,
      sender: data.sender
    }
  });
  let conversationId = null;
  let type = 'SINGLEWHEEL';
  let status = false;
  if (chatSession && chatSession.conversationId) {
    type = chatSession.type;
    conversationId = chatSession.conversationId;
    let createAt = Number(chatSession.createdAt);
    let expiredAt = Number(chatSession.expiredAt);
    if (createAt < datetime && expiredAt > datetime) {
      status = true;
    }
  }
  return { conversationId: conversationId, type: type, status: status }
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
  let chatSession = null;
  let type = null;
  let status = true;
  let content = data.text.content.trim();
  //循环遍历模块类型，发送钉钉消息
  ChatModeTypes.forEach((item, index, array) => {

    if (item.name.indexOf(content) != -1) {
      status = false;
      const message = item.message.replace("#name", data.senderNick);
      const messageBody = message.replace("#time", ChatModeDateTime);
      dingTalkSend(app, messageBody, data, "");
      if (item.type) {
        type = item.type;
      }
    }
  });

  //type 存在则表明为：单聊、串聊、重置
  if (type) {
    //如果为重置则获取原有type类型是单聊还是串聊。默认是单聊
    const chatSessionJson = await chatSessionfindBy({ groupId: data.conversationId, sender: data.senderStaffId });
    if (chatSessionJson && chatSessionJson.type) {
      if (type === "RESET") {
        type = chatSessionJson.type;
      }
      const chatSession = {
        groupId: data.conversationId,
        sender: data.senderStaffId,
        appId: app.id,
        organizationId: app.organizationId,
        type: type
      }
      if (chatSessionJson.conversationId) {
        await chatsessionInsertToUpdate(chatSession, true);
      } else {
        await chatsessionInsertToUpdate(chatSession, false);
      }


    }
  }
  return status;
}
const chatsessionInsertToUpdate = async (chatSession: ChatSession, status: boolean) => {
  let datetime = new Date();
  let expiredAt = new Date(Date.now() + ChatModeDateTime * 60000);
  let uuid = randomUUID();
  if (status) {
    await prisma.chatSession.updateMany({
      where: {
        groupId: chatSession.groupId,
        sender: chatSession.sender,
      },
      data: {
        createdAt: datetime,
        expiredAt: expiredAt,
        type: chatSession.type,
        conversationId: uuid
      }
    })
  } else {
    //写入数据库，限定时间：ChatModeDateTime
    await prisma.chatSession.create({
      data: {
        createdAt: datetime,
        expiredAt: expiredAt,
        sender: chatSession.sender,
        appId: chatSession.appId,
        organizationId: chatSession.organizationId,
        groupId: chatSession.groupId,
        type: chatSession.type,
        conversationId: uuid
      }
    });
  }
}

const DingTalkStartSend = async (
  data: JSON,
  app: App & { aiResource: AIResource }
) => {
  let token = null;
  const chatSessionJson = await chatSessionfindBy({ groupId: data.conversationId, sender: data.senderStaffId });
  if (chatSessionJson.type === "MUITIWHEEL" && !chatSessionJson.status) {
    const chatSession = {
      groupId: data.conversationId,
      sender: data.senderStaffId,
      appId: app.id,
      organizationId: app.organizationId,
      type: "SINGLEWHEEL"
    }
    await chatsessionInsertToUpdate(chatSession, true);
    const message = chatTemplate.ExpireWord.replace("#name", data.senderNick);
    token = await dingTalkSend(app, message, data, "");
  } else {
    token = await dingTalkSend(app, chatTemplate.OpenWord, data, "");
  }
  return token;
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
      dingTalkSend(app, "Token已耗尽，请联系相关人员添加Token", data, "");
      return;
    }
    //console.log(data);
    const unionStatus = await chatModeMessage(data, app, res);
    if (unionStatus) {
      let token = await DingTalkStartSend(data, app);
       handleDingTalkMessage(data, app, res, token);
    }


  } else {
    res.end('ok');
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  handleRequest(req, res);
}
