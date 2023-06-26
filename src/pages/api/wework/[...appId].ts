import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource, Message, RecievedMessage } from '@prisma/client';
import { getSignature, decrypt, encrypt } from '@wecom/crypto';
import MessageQueue from 'pages/api/queues/messages';
import { NotFoundError } from '@prisma/client/runtime/library';
import { AppConfig } from 'types/wework';
import {XMLParser} from 'fast-xml-parser';

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

const firstResponseXML = (toUser:string, fromUser:string) =>  `
<xml>
   <ToUserName><![CDATA[${toUser}]]></ToUserName>
   <FromUserName><![CDATA[${fromUser}]]></FromUserName> 
   <CreateTime>${Date.now()}</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[正在产生内容]]></Content>
</xml>
`;



// Verify wework api request and app id, return app if appid is valid and this is not a wework api verification request
const weworkVerify = async(req: NextApiRequest, res: NextApiResponse) => {
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

  const app = await findApp(appId) as App & { aiResource : AIResource };


  const config = app.config as AppConfig;
  if(echostr){
    const { message, id } = decrypt(config.encodingAESKey, echostr);
    return {app, isVerification: true, verificationMessage:message};
  }
  return {app, isVerification: false, verificationMessage:null};
}


export default async (req: NextApiRequest, res: NextApiResponse) => {
  //console.log(req);
  const {app, isVerification, verificationMessage} = await weworkVerify(req, res);
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
  const encryptString = jsonBody.xml.msg_encrypt;
  const config = app.config as AppConfig;
  const decrypted = decrypt(config.encodingAESKey, encryptString);
  const decryptedJson = new XMLParser().parse(decrypted.message).xml;
  const resBody = encrypt(config.encodingAESKey, firstResponseXML(decryptedJson.fromUser, config.corpId), decrypted.id);

  const recievedMessage = await prisma.recievedMessage.create(
    {
      data:{
        id: decrypted.id,
        data: decryptedJson,
        recievedAt: new Date(),
        createdAt: new Date(),
        processing: true,
        appId: app.id,
        type: 'WEWORK',
        eventName: 'WeWork_message_received',

      }
    }
  );


  await MessageQueue.enqueue(
    { recievedMessage: recievedMessage, history: [], app: app }, // job to be enqueued
    { delay: 1 } // scheduling options
  );

  res.setHeader('Content-Type', 'text/xml').end(resBody);

};