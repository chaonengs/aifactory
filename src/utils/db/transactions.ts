import { messageCard } from '@larksuiteoapi/node-sdk';
import { AIResource, App, PrismaClient, Message, Usage } from '@prisma/client';
import { ProcessMessageBody } from 'types/queue';

const prisma = new PrismaClient();

export const logSensitiveWord = async (message:Message, organizationId:string) => {
  const organization = await prisma.organization.findFirstOrThrow({
    where: { id: organizationId },
    include: {
      sensitiveWords: true
    }
  });

  const matched = organization.sensitiveWords.filter((v,i,a)=>{
    return message.content.includes(v.value);
  });

  let transList = [];
  matched.forEach((v,i,a)=>{
    const t = prisma.sensitiveWordInMessage.create({
      data: {
        messageId: message.id,
        sensitiveWordId: v.id,
        plainText: v.value,
      }
    });
    transList.push(t);
  })

  if(transList.length > 0){
    await prisma.$transaction(transList);
  }
}

export const saveMessage = async (message: Message, app: App, aiResource: AIResource, usage: Usage) => {
  let transList = [];

  transList.push(
    prisma.message.create({
      data: {
        senderUnionId: message.senderUnionId,
        sender: message.sender,
        content: message.content,
        answer: message.answer,
        appId: app.id,
        conversationId: message.conversationId,
        usage: {
          create: {
            aiResourceId: usage.aiResourceId,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.promptTokens + usage.completionTokens
          }
        },
        recievedMessageId: message.recievedMessageId,
        organizationId: app.organizationId
      }
    })
  );

  transList.push(
    prisma.aIResource.update({
      where: { id: aiResource.id },
      data: {
        tokenRemains: aiResource.tokenRemains - usage.promptTokens - usage.completionTokens,
        tokenUsed: aiResource.tokenUsed + usage.promptTokens + usage.completionTokens
      }
    })
  );

  transList.push(prisma.app.update({
    where: { id: app.id },
    data: {
      tokenUsed: app.tokenUsed + usage.promptTokens + usage.completionTokens
    }
  }));

  return await prisma.$transaction(transList);

};

export const finishProcessing = async (recievedMessageId: string) => {
  prisma.recievedMessage.update({
    where: { id: recievedMessageId },
    data: {
      processing: false
    }
  });
};
