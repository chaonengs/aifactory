import { AIResource, App as PrismaApp, Message as PrismaMessage } from '@prisma/client/edge';
import { encode } from 'gpt-tokenizer';
import { MessageQueueBody } from 'pages/api/queues/messages';
import { DingTalkAppConfig } from 'types/app';
import { ReceiveMessageData } from 'types/feishu';
import dingTalkMessageSend from 'utils/dingtalk/client';
import { OpenAIChatComletion, OpenAIRequest } from 'utils/server/openai';
import { MessageDBSaveRequest, Message , Usage  } from 'pages/api/db/saveProcesserResult';

const saveProcesserResult = async ({
  repliedMessage,
  app,
  answer,
  usage
}: {
  repliedMessage: PrismaMessage;
  app: PrismaApp & { aiResource: AIResource };
  answer: string;
  usage: Usage;
}) => {
  const params = { repliedMessage, usage, app, aiResource: app.aiResource, finished: true };
  const body = JSON.stringify({ receivedMessageId: repliedMessage.conversationId, params });
  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveProcesserResult`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
};




const processMessage = async ({ receivedMessage, history, app }: MessageQueueBody) => {
  let processResult = null;
  const appConfig = app.config as DingTalkAppConfig;
  //@ts-ignore
  const receivedMessageData = receivedMessage.data as ReceiveMessageData;
  const question = receivedMessageData.text.content;
  const messages = new Array();
  let promptTokens = 0;

  for (let i = 0; i < history.length; i++) {
    const answerMessage = {
      role: 'assistant',
      content: history[i].answer
    };
    const answerTokens = encode(answerMessage.content).length;
    if (promptTokens + answerTokens > appConfig.ai.maxPromptTokens) {
      break;
    }
    promptTokens += answerTokens;
    messages.unshift(answerMessage);

    const contentMessage = {
      role: 'user',
      content: history[i].content
    };
    const conentTokens = encode(contentMessage.content).length;
    if (promptTokens + conentTokens > appConfig.ai.maxPromptTokens) {
      break;
    }
    promptTokens += conentTokens;
    messages.unshift(contentMessage);
  }

  const message = {
    role: 'user',
    content: question
  };

  messages.push(message);


  const params: OpenAIRequest = {
    hostUrl: app.aiResource.hostUrl,
    type: app.aiResource.type,
    apiVersion: app.aiResource.apiVersion,
    model: app.aiResource.model,
    systemPrompt: '',
    temperature: appConfig.ai.temperature,
    key: app.aiResource.apiKey,
    messages: messages,
    stream: false,
    maxTokens: appConfig.ai.maxCompletionTokens,
    maxPromptTokens: appConfig.ai.maxPromptTokens
  };
  const result = await OpenAIChatComletion(params);
  const json = await result.json();
  const answer = json.choices[0].message.content;
  const usage:Usage = {
    promptTokens: json.usage.prompt_tokens,
    completionTokens:  json.usage.completion_tokens,
    totalTokens:  json.usage.total_tokens,
  }
  await dingTalkMessageSend(app, answer, receivedMessageData);
  const repliedMessage = {
    senderUnionId: receivedMessageData?.senderStaffId || 'anonymous',
    sender: receivedMessageData?.senderNick || 'anonymous',
    content: question,
    answer: answer,
    appId: app.id,
    conversationId: receivedMessageData.unionMessageId,
    recievedMessageId: receivedMessageData.msgId
  };
  await saveProcesserResult({ repliedMessage, app, usage, answer });
  return processResult;
};



export { processMessage };

