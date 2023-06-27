import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource, Message, ReceivedMessage } from '@prisma/client';
import { getSignature, decrypt, encrypt } from '@wecom/crypto';
import MessageQueue from 'pages/api/queues/messages';
import { NotFoundError, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppConfig } from 'types/wework';
import { XMLParser } from 'fast-xml-parser';
import { error } from 'console';
import { now } from 'next-auth/client/_utils';

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

const firstResponseXML = (toUser: string, fromUser: string) => `
<xml>
   <ToUserName><![CDATA[${toUser}]]></ToUserName>
   <FromUserName><![CDATA[${fromUser}]]></FromUserName> 
   <CreateTime>${now()}</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[正在产生内容]]></Content>
</xml>
`;

const wrapResponeMessage = (encrypted: string) => `<xml>
<Encrypt><![CDATA[msg_encrypt]]></Encrypt>
<MsgSignature><![CDATA[msg_signature]]></MsgSignature>
<TimeStamp>timestamp</TimeStamp>
<Nonce><![CDATA[nonce]]></Nonce>
</xml>`;

// Verify wework api request and app id, return app if appid is valid and this is not a wework api verification request
const weworkVerify = async (req: NextApiRequest, res: NextApiResponse) => {
  let { appId, echostr } = req.query;
  if (Array.isArray(appId)) {
    appId = appId[0];
  }
  if (!appId) {
    throw new Error('Invalid appid: ' + appId);
  }
  if (Array.isArray(echostr)) {
    echostr = echostr[0];
  }

  const app = (await findApp(appId)) as App & { aiResource: AIResource };

  const config = app.config as AppConfig;
  if (echostr) {
    const { message, id } = decrypt(config.encodingAESKey, echostr);
    return { app, isVerification: true, verificationMessage: message };
  }
  return { app, isVerification: false, verificationMessage: null };
};

const makeRespone = (config: AppConfig, decryptedJson: any) => {
  const timestamp = now();
  const nonce = Math.random() * 10000000000;
  const messageXML = firstResponseXML(decryptedJson.FromUserName, config.corpId);
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
  const decryptedJson = new XMLParser().parse(decrypted.message).xml;
  const resBody = makeRespone(config, decryptedJson);

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
    await MessageQueue.enqueue(
      { receivedMessage: receivedMessage, history: [], app: app }, // job to be enqueued
      { delay: 1 } // scheduling options
    );
    console.log(resBody);
    res.setHeader('Content-Type', 'text/xml').end(resBody);
  } catch (e) {
    console.error(e);
    if ((e as PrismaClientKnownRequestError).code === 'P2002') {
      res.setHeader('Content-Type', 'text/xml').end(resBody);
    } else {
      throw e;
    }
  }
};
