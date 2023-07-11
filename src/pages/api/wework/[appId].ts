import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource, Message, ReceivedMessage, ChatSessionType } from '@prisma/client';
import { getSignature, decrypt, encrypt } from '@wecom/crypto';
import MessageQueue from 'pages/api/queues/messages';
import { NotFoundError, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppConfig, Message as WeworkReceivedMessage } from 'types/wework';
import { XMLParser } from 'fast-xml-parser';
import { error } from 'console';
import { now } from 'next-auth/client/_utils';
import { ChatCommands } from 'constant';
import { findSensitiveWords } from 'utils/db/transactions';
import { randomUUID } from 'crypto';

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

const wrapResponeMessage = (message: string, toUser: string, fromUser: string) => `
<xml>
   <ToUserName><![CDATA[${toUser}]]></ToUserName>
   <FromUserName><![CDATA[${fromUser}]]></FromUserName> 
   <CreateTime>${now()}</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[${message}]]></Content>
</xml>
`;

const firstResponseXML = (toUser: string, fromUser: string) => wrapResponeMessage('开始生产内容', toUser, fromUser);



// Verify wework api request and app id, return app if appid is valid and this is not a wework api verification request
const weworkVerify = async (req: NextApiRequest, res: NextApiResponse) => {
  let { appId, echostr } = req.query;
  if (!appId) {
    throw new Error('Invalid appid: ' + appId);
  }
  if (Array.isArray(echostr)) {
    echostr = echostr[0];
  }

  const app = (await findApp(appId as string)) as App & { aiResource: AIResource };

  const config = app.config as AppConfig;
  if (echostr) {
    const { message, id } = decrypt(config.encodingAESKey, echostr);
    return { app, isVerification: true, verificationMessage: message };
  }
  return { app, isVerification: false, verificationMessage: null };
};

const makeRespone = (messageXML: string, config: AppConfig) => {
  const timestamp = now();
  const nonce = Math.random() * 10000000000;
  // const messageXML = firstResponseXML(decryptedJson.FromUserName, config.corpId);
  console.log("messageXML: ", messageXML);
  const encrypted = encrypt(config.encodingAESKey,messageXML , config.corpId);
  const signature = getSignature(config.encodingAESKey, timestamp, String(nonce), encrypted);
  return `<xml>
    <Encrypt><![CDATA[${encrypted}]]></Encrypt>
    <MsgSignature><![CDATA[${signature}]]></MsgSignature>
    <TimeStamp>${timestamp}</TimeStamp>
    <Nonce><![CDATA[${String(nonce)}]]></Nonce>
  </xml>`;
};

const findCommand = (text: string) => {
  let matched = null;
  for(let i = 0; i < ChatCommands.length; i++) {
    if (ChatCommands[i].name.indexOf(text) != -1) {
      matched = ChatCommands[i];
    }
  }
  return matched;
}

const handleChatCommands = async (message:WeworkReceivedMessage, app: App, res: NextApiResponse) => {
  const command = findCommand(message.Content.trim());
  if(command){
    if (command.type === ChatSessionType.MUITIWHEEL || command.type === 'RESET') {
      await prisma.chatSession.upsert({
        where: {
          groupId_sender_appId: {
            groupId: message.FromUserName,
            sender: message.FromUserName,
            appId: app.id
          }
        },
        update: {
          createdAt: new Date(),
          expiredAt: new Date(new Date().getTime() + 10 * 60000),
          type: ChatSessionType.MUITIWHEEL,
          conversationId: randomUUID(),
        },
        create: {
          sender: message.FromUserName,
          appId: app.id,
          organizationId: app.organizationId,
          groupId: message.FromUserName,
          conversationId: randomUUID(),
          createdAt: new Date(),
          expiredAt: new Date(new Date().getTime() + 10 * 60000),
          type: ChatSessionType.MUITIWHEEL,
        }
      });
    }
    if (command.type === ChatSessionType.SINGLEWHEEL) {
      await prisma.chatSession.upsert({
        where: {
          groupId_sender_appId: {
            groupId: message.FromUserName,
            sender: message.FromUserName,
            appId: app.id
          }
        },
        update: {
          createdAt: new Date(),
          expiredAt: new Date(new Date().getTime() + 10 * 60000),
          type: ChatSessionType.SINGLEWHEEL,
          conversationId: randomUUID(),
        },
        create: {
          sender: message.FromUserName,
          appId: app.id,
          organizationId: app.organizationId,
          groupId: message.FromUserName,
          conversationId: randomUUID(),
          createdAt: new Date(),
          expiredAt: new Date(new Date().getTime() + 10 * 60000),
          type: ChatSessionType.SINGLEWHEEL,
        }
      });
    }

    const wrapped = wrapResponeMessage(command.message.replace('，#name', ''), message.FromUserName, message.ToUserName);
    res.end(makeRespone(wrapped, app.config as AppConfig));
    return true;
  }
  return false;
}

const handleSensitiveWords = async (message:WeworkReceivedMessage, app: App, res: NextApiResponse) => {
  const matched = await findSensitiveWords(message.Content, app.organizationId);

}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { app, isVerification, verificationMessage } = await weworkVerify(req, res);
  if (!app) {
    throw new Error('app not found');
  }
  if (isVerification) {
    res.end(verificationMessage);
    return;
  }
  if (!app.aiResource) {
    throw new Error('resource not found');
  }

  const xmlString = req.body;

  const jsonBody = new XMLParser().parse(xmlString);
  const encryptString = jsonBody.xml.Encrypt;
  const config = app.config as AppConfig;
  const decrypted = decrypt(config.encodingAESKey, encryptString);
  console.debug(decrypted);
  const decryptedJson = new XMLParser().parse(decrypted.message).xml as WeworkReceivedMessage;

  if(await handleChatCommands(decryptedJson, app, res)) {
    return;
  }
  const chatSession = await prisma.chatSession.findUnique({
    where: {
      groupId_sender_appId: {
        groupId: decryptedJson.FromUserName,
        sender: decryptedJson.FromUserName,
        appId: app.id,
      }
    }
  });

  let history:Message[] = [];
  if (chatSession && chatSession.expiredAt > new Date() && chatSession.type === ChatSessionType.MUITIWHEEL) {
    history = await prisma.message.findMany({
      where: {
        conversationId: chatSession.conversationId
      }
    })
  } 

  try {
    const receivedMessage = await prisma.receivedMessage.create({
      data: {
        id: String(decryptedJson.MsgId),
        data: decryptedJson,
        recievedAt: new Date(),
        createdAt: new Date(),
        processing: true,
        appId: app.id,
        type: 'WEWORK',
        eventName: 'WeWork_message_received'
      }
    });

    const matched = await findSensitiveWords(decryptedJson.Content, app.organizationId);
    await MessageQueue.enqueue(
      { receivedMessage: receivedMessage, history: history, sensitiveWords: matched, app: app }, // job to be enqueued
      { delay: 1 } // scheduling options
    );
    const resBody = makeRespone(firstResponseXML(decryptedJson.FromUserName, decryptedJson.ToUserName), config);
    res.setHeader('Content-Type', 'text/xml').end(resBody);
  } catch (e) {
    if ((e as PrismaClientKnownRequestError).code === 'P2002') {
      res.end('ok');
    } else {
      throw e;
    }
  }
};
