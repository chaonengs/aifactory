import { AIResource, App, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const createMessage = async (
    question: string,
    answer: string,
    senderName: string,
    senderUnionId: string,
    propmtTokens: number,
    completionTokens: number,
    app: App & { aiResource: AIResource }
  ) => {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          senderUnionId: senderUnionId,
          sender: senderName,
          content: question,
          answer: answer,
          appId: app.id,
          usage: {
            create: {
              aiResourceId: app.aiResourceId,
              promptTokens: propmtTokens,
              completionTokens: completionTokens,
              totalTokens: propmtTokens + completionTokens
            }
          }
        }
      }),
      prisma.aIResource.update({
        where: { id: app.aiResourceId },
        data: {
          tokenRemains: app.aiResource.tokenRemains - propmtTokens - completionTokens,
          tokenUsed: app.aiResource.tokenUsed + propmtTokens + completionTokens
        }
      }),
      prisma.app.update({
        where: { id: app.id },
        data: {
          tokenUsed: app.tokenUsed + propmtTokens + completionTokens
        }
      })
    ]);
  
    return answer;
  };

  export {createMessage};