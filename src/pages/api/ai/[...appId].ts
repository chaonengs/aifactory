import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, App, Prisma, AIResource } from '@prisma/client';
import * as lark from '@larksuiteoapi/node-sdk';
import { chat, createConfiguration } from 'utils/server/openai';
import { OpenAIChatComletion } from 'utils/server';
import { OpenAIModelID, OpenAIModels } from 'types/openai';

const prisma = new PrismaClient();

const findApp = async (id: string) => {
  return await prisma.app.findUnique({
    where: {
      id
    },
    include: {
      aiResource: true
    }
  });
};


const createMessage = async (message: string, app: App & { aiResource: AIResource }) => {
  let aiResult;
  
  aiResult = await (await OpenAIChatComletion(OpenAIModels[OpenAIModelID.GPT_3_5], message, 1, app.aiResource.apiKey, false)).json()
  await prisma.$transaction([
    prisma.message.create({
      data:{
        senderUnionId: 'anonymous',
        sender: 'anonymous',
        content: message,
        answer: aiResult.choices[0].message.content,
        appId: app.id,
        usage: {
          create:{
            aiResourceId: app.aiResourceId,
            promptTokens: aiResult.usage.prompt_tokens as number,
            completionTokens: aiResult.usage.completion_tokens as number,
            totalTokens: aiResult.usage.total_tokens as number
          }
        }
      }
    }),
    // prisma.usage.create({
    //   data: {
    //     message: {
    //       create: {
    //         senderUnionId: 'anonymous',
    //         sender: 'anonymous',
    //         content: message,
    //         answer: aiResult.choices[0].message.content,
    //         appId: app.id
    //       }
    //     },
    //     aiResourceId: app.aiResourceId,
    //     promptTokens: aiResult.usage.prompt_tokens as number,
    //     completionTokens: aiResult.usage.completion_tokens as number,
    //     totalTokens: aiResult.usage.total_tokens as number
    //   }
    // }),
    prisma.aIResource.update({
      where: { id: app.aiResourceId },
      data: {
        tokenRemains: app.aiResource.tokenRemains - aiResult.usage.total_tokens,
        tokenUsed: app.aiResource.tokenUsed + aiResult.usage.total_tokens
      }
    }),
    prisma.app.update({
      where: { id: app.id },
      data: {
        tokenUsed: app.tokenUsed + aiResult.usage.total_tokens
      }
    })
  ]);

  return aiResult.choices[0].message.content;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { appId } = req.query;
  let id = null;
  if (Array.isArray(appId)) {
    id = appId[0];
  } else {
    id = appId;
  }
  if (id) {
    const app = await findApp(id);
    if (app === null) {
      res.status(404).end('not found');
    } else {
        const answer = await createMessage(req.body, app)
        res.end(answer);
    }
  } else {
    res.status(404).end('not found');
  }
}
