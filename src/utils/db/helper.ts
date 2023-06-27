import { ProcessMessageBody } from "pages/api/db/saveProcesserResult";

const createProcessMessageBody = (
    question: string,
    answer: string,
    senderName: string,
    senderUnionId: string,
    propmtTokens: number,
    completionTokens: number,
    app: any,
    conversationId: string,
    receivedMessageId: string,
    isAIAnswer: boolean
  ) => {
    const message = {
      senderUnionId: senderUnionId,
      sender: senderName,
      content: question,
      answer: answer,
      appId: app.id,
      conversationId: conversationId,
      receivedMessageId: receivedMessageId,
      isAIAnswer: isAIAnswer,
    };
  
    const usage = {
      promptTokens: propmtTokens,
      completionTokens: completionTokens,
      totalTokens: propmtTokens + completionTokens
    };
  
    const requestBody: ProcessMessageBody = {
      message: message,
      usage: usage,
    };
    return requestBody;
  };

  export {createProcessMessageBody}