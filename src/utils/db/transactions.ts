import { AIResource, App, PrismaClient, Message, Usage } from '@prisma/client';
import { ProcessMessageBody } from 'types/queue';

const prisma = new PrismaClient();

const saveMessage = async (message: Message, app: App, aiResource: AIResource, usage: Usage) => {
  const organization = await prisma.organization.findFirstOrThrow({
    where: { id: app.organizationId },
    include: {
      sensitiveWords: true
    }
  });

  let transList = [];

  transList.push(
    prisma.message.create({
      data: {
        senderUnionId: message.senderUnionId,
        sender: message.sender,
        content: message.content,
        answer: message.answer,
        appId: app.id,
        feishuMessageId: message.feishuMessageId,
        conversationId: message.conversationId,
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

  const [savedMessage,r,a] = await prisma.$transaction(transList);

  const matched = organization.sensitiveWords.filter((v,i,a)=>{
    return savedMessage.content.includes(v.value);
  });

  transList = [];
  matched.forEach((v,i,a)=>{
    const t = prisma.sensitiveWordInMessage.create({
      data: {
        messageId: savedMessage.id,
        sensitiveWordId: v.id,
        plainText: v.value,
      }
    });
    transList.push(t);
  })

  await prisma.$transaction(transList);

};

const finishFeishuProcess = async (feishuMessageId: string) => {
  prisma.feiShuMessage.update({
    where: { id: feishuMessageId },
    data: {
      processing: false
    }
  });
};
export { saveMessage, finishFeishuProcess };
