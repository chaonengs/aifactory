import { AIResource, App, Prisma, PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai-streams/node';

import { encode } from 'gpt-tokenizer';
import { createMessage } from 'utils/db/transactions';
import * as lark from '@larksuiteoapi/node-sdk';
import { User } from 'types/feishu';

const prisma = new PrismaClient();

const getFeishuUser = async (client: lark.Client, userId: string) => {
    const req = {
      user_id_type: 'union_id',
      department_id_type: ''
    };
    const res = await client.contact.user.get({
      params: {
        user_id_type: 'union_id',
        department_id_type: 'department_id'
      },
      path: {
        user_id: userId
      }
    });
    return res.data?.user;
  };

const messageCard = (title:string, message:string, error:string|null|undefined = null) => {
    const card = {
        "config": {
          "wide_screen_mode": true
        },
        "elements": [
          {
            "tag": "div",
            "text": {
              "content": message,
              "tag": "plain_text"
            }
          }
        ],
        "header": {
          "template": "blue",
          "title": {
            "content": title,
            "tag": "plain_text"
          }
        }
      };

    if(error){
        card.elements.push({
            "tag": "div",
            "text": {
              "content": error,
              "tag": "plain_text"
            }
        })
    }
    return JSON.stringify(card)
} 

const processFeishuMessage = async (messageId:string) => {
    const feishuMessage = await prisma.feiShuMessage.findUniqueOrThrow({where:{id:messageId}});
    const app = await prisma.app.findUniqueOrThrow({
        where: {
          id: feishuMessage.appId,
        },
        include: {
          aiResource: true
        }
      });
    const config = app.config as Prisma.JsonObject;
    const client = new lark.Client({
      appId: config['appId'] as string,
      appSecret: config['appSecret'] as string,
      appType: lark.AppType.SelfBuild,
      domain: config['domain'] as string
    });
  
    const sendResult = await client.im.message.reply({
      path: {
          message_id: messageId
          },
        data: {
        content: messageCard('正在询问OpenAI', '...'),
        msg_type: 'interactive'
        }
    });
  
    const question =  JSON.parse(feishuMessage.data.message.content).text;
      let airesult:string = '';
      let completionTokens = 0;
      let feishuSender: User | null | undefined = null;
      if(feishuMessage.data.sender.sender_id?.union_id){
          const u =   await getFeishuUser(client, feishuMessage.data.sender.sender_id.union_id)
          if(u){
              feishuSender = u as User;
          }
      }
      try{
          const stream = await OpenAI(
              'chat',
              {
              model: 'gpt-3.5-turbo',
              messages: [
                  {
                  role: 'user',
                  content: question
                  }
              ]
              },
              { apiKey: app.aiResource.apiKey, mode: 'tokens' }
          );
  
          stream.on('data', async (data) => {
              const decoder = new TextDecoder();
              completionTokens += 1;
              if (airesult) {
                  airesult += decoder.decode(data);
              } else {
                  airesult = decoder.decode(data);
              }
              if(completionTokens % 10 === 0){
                  const cardResult = await client.im.message.patch({
                      path: {
                      message_id: sendResult.data?.message_id as string
                      },
                      data: {
                      content: messageCard('回复中', airesult),
                      }
                  });
              }
          });
  
          stream.on('end', async () => {
            setTimeout(async () => {
              const cardResult = await client.im.message.patch({
                path: {
                message_id: sendResult.data?.message_id as string
                },
                data: {
                content: messageCard('回复结束', airesult),
                }
            });
            }, 1000);
              
  
              await createMessage(question, airesult, feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous', feishuSender?.union_id || 'anonymous', encode(question).length, completionTokens, app);
              await prisma.feiShuMessage.update({
                  where: { id: messageId },
                  data: {
                      processing: false
                  }
              });
          });
        } catch (error)
        {
            console.error(error);
            await client.im.message.patch({
                path: {
                message_id: sendResult.data?.message_id as string
                },
                data: {
                content: messageCard('未正常响应',airesult, '出现错误，请稍后再试'),
                }
            });
            if(airesult && airesult !== ''){
                await createMessage(question, airesult, feishuSender?.name || feishuSender?.en_name || feishuSender?.union_id || 'anonymous', feishuSender?.union_id || 'anonymous', encode(question).length, completionTokens, app);
            }
            await prisma.feiShuMessage.update({
              where: { id: messageId },
              data: {
                  processing: false
              }
          });
        }
  
  }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { messageId } = req.query;
    processFeishuMessage(messageId as string);
    res.end('ok')
}


export {processFeishuMessage};