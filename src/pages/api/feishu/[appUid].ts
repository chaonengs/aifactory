import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, App, Prisma, AIResource } from '@prisma/client'
import * as lark from '@larksuiteoapi/node-sdk';
import {chat, createConfiguration} from 'utils/server/openai';

const prisma = new PrismaClient()

const findApp = async (appUid:string) =>{return await prisma.app.findUnique({
    where: {
      uid:   appUid,
    },
    include: {
        aiResource: true,
      },
  })
}

const getFeishuUser = async (client: lark.Client, userId: string) =>{
    const req = {
        user_id_type:'union_id',
        department_id_type:''
    }
    const res = await client.contact.user.get({
        params:{
            user_id_type: 'union_id',
            department_id_type:'department_id'
        },
        path:{
            user_id: userId
        }
    }
    );
    return res.data?.user
}

const eventDispatcher = (app:App & {aiResource:AIResource}) => {
    if (app.config === null) {
        throw Error('App is not configed')
    }
    const config = app.config as Prisma.JsonObject;
    const client = new lark. Client({
        appId: config['appId'] as string,
        appSecret: config['appSecret'] as string,
        appType: lark.AppType.SelfBuild,
        domain: config['domain'] as string,
    });
    return  new lark.EventDispatcher({
        encryptKey: config['encryptKey'] as string,
    }).register({
        'im.message.receive_v1': async (data) => {
            const messageContent = data.message.content;
            const result = await chat(createConfiguration(app), messageContent, app.aiResource.model as string);
            const feishuSender = await getFeishuUser(client, result.data.sender.sender_id);
            prisma.usage.create(
                {
                    data:{
                        message: {
                            create: {
                                senderUnionId: feishuSender?.union_id as string,
                                sender: feishuSender?.name ? feishuSender.name: data.sender.sender_id as string,
                                content: data.message.content as string,
                                answer: result.data.choices[0],
                                appId: app.id,
                            }
                        },
                        aiResourceId: app.aiResourceId,
                        promptTokens: result.data.usage.prompt_tokens,
                        completionTokens: result.data.usage.completion_tokens,
                        totalTokens: result.data.usage.completion_tokens,
                    }
                }
            )
 
            const chatId = data.message.chat_id;
            const res = await client.im.message.create({
                params: {
                    receive_id_type: 'chat_id',
                },
                data: {
                    receive_id: chatId,
                    content: JSON.stringify({text: result.data.choices[0].text}),
                    msg_type: 'text'
                },
            });
            return res;
        }
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { appUid } = req.query;
    if(typeof(appUid) == 'string'){
        const app = await findApp(appUid);
        app?.aiResource
        if(app === null){
            res.status(404).end('not found')
        } else {
            const dispatcher = eventDispatcher(app);
            const data = req.body;
            const result = await dispatcher.invoke(data);
            res.end(result)
        }

    } else {
        res.status(404).end('not found')
    }
  }