import { Message, PrismaClient } from '@prisma/client';
import { Message as MessageToSave, Usage as UsageToSave } from 'pages/api/db/saveProcesserResult';

const prisma = new PrismaClient();

export const findSensitiveWords = async (messageContent:string, organizationId:string) => {
  const organization = await prisma.organization.findFirstOrThrow({
    where: { id: organizationId },
    include: {
      sensitiveWords: true
    }
  });

  const matched = organization.sensitiveWords.filter((v,i,a)=>{
    return messageContent.includes(v.value);
  });
  
  return matched;
}



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
    return await prisma.$transaction(transList);
  }
  return null;
}

export const saveMessage = async (message: MessageToSave, usage: UsageToSave) => {
  let transList = [];
  const app = await prisma.app.findUniqueOrThrow({
    where: {
      id: message.appId
    },
    include: {
      aiResource: true
    }
  });

  if(!app.aiResource){
    throw new Error('no resource');
  }
  transList.push(
    prisma.message.create({
      data: {
        senderUnionId: message.senderUnionId,
        sender: message.sender,
        content: message.content,
        answer: message.answer,
        appId: app.id,
        conversationId: message.conversationId,
        isAIAnswer: message.isAIAnswer || false,
        hasError: message.hasError || false,
        usage: {
          create: {
            aiResourceId: app.aiResource.id,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.promptTokens + usage.completionTokens
          }
        },
        receivedMessageId: message.receivedMessageId,
        organizationId: app.organizationId
      }
    })
  );

  transList.push(
    prisma.aIResource.update({
      where: { id: app.aiResource.id },
      data: {
        tokenRemains: app.aiResource.tokenRemains - usage.promptTokens - usage.completionTokens,
        tokenUsed: app.aiResource.tokenUsed + usage.promptTokens + usage.completionTokens
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

export const finishProcessing = async (receivedMessageId: string) => {
  prisma.receivedMessage.update({
    where: { id: receivedMessageId },
    data: {
      processing: false
    }
  });
};
