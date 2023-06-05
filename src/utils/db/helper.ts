import { ProcessMessageBody } from "types/queue";

const createProcessMessageBody = (
    question: string,
    answer: string,
    senderName: string,
    senderUnionId: string,
    propmtTokens: number,
    completionTokens: number,
    app: any,
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

  export {createProcessMessageBody}