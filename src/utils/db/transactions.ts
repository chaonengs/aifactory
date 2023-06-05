import { AIResource, App, PrismaClient, Message, Usage } from '@prisma/client';
import { ProcessMessageBody } from 'types/queue';

const prisma = new PrismaClient();

const saveMessage = async (message: Message, app: App, aiResource: AIResource, usage: Usage) => {
  await prisma.$transaction([
    prisma.message.create({
      data: {
        senderUnionId: message.senderUnionId,
        sender: message.sender,
        content: message.content,
        answer: message.answer,
        appId: app.id,
        usage: {
          create: {
            aiResourceId: usage.aiResourceId,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.promptTokens + usage.completionTokens
          }
        },
        organizationId: app.organizationId
      }
    }),
    prisma.aIResource.update({
      where: { id: aiResource.id },
      data: {
        tokenRemains: aiResource.tokenRemains - usage.promptTokens - usage.completionTokens,
        tokenUsed: aiResource.tokenUsed + usage.promptTokens + usage.completionTokens
      }
    }),
    prisma.app.update({
      where: { id: app.id },
      data: {
        tokenUsed: app.tokenUsed + usage.promptTokens + usage.completionTokens
      }
    })
  ]);
};

const createProcessMessageBody = (
  question: string,
  answer: string,
  senderName: string,
  senderUnionId: string,
  propmtTokens: number,
  completionTokens: number,
  app: App & { aiResource: AIResource }
) => {
  const message = {
    senderUnionId: senderUnionId,
    sender: senderName,
    content: question,
    answer: answer,
    appId: app.id
  };

  const usage = {
    aiResourceId: app.aiResourceId,
    promptTokens: propmtTokens,
    completionTokens: completionTokens,
    totalTokens: propmtTokens + completionTokens
  };

  const requestBody: ProcessMessageBody = {
    app: app,
    message: message,
    usage: usage,
    aiResource: app.aiResource
  };
  return requestBody;
};


const finishFeishuProcess = async (feishuMessageId:string) => {
   prisma.feiShuMessage.update({
    where: { id: feishuMessageId },
    data: {
      processing: false
    }
  });
}
export { createProcessMessageBody, saveMessage, finishFeishuProcess };
