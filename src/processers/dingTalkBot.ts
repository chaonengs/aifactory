import { AIResource, App, Message as PrismaMessage } from '@prisma/client/edge';
import { encode } from 'gpt-tokenizer';
import { MessageQueueBody } from 'pages/api/queues/messages';
import { DingTalkAppConfig } from 'types/app';
import { ReceiveMessageData } from 'types/feishu';
import dingTalkMessageSend from 'utils/dingtalk/client';
import { OpenAIChatComletion, OpenAIRequest } from 'utils/server/openai';
import { MessageDBSaveRequest, Message, Usage } from 'pages/api/db/saveProcesserResult';
/**
 * 写入message数据库接口调用方法
 * @param param0 
 */
const saveProcesserResult = async ({
  repliedMessage,
  usage
}: {
  repliedMessage: Message;
  usage: Usage;
}) => {
  const params = { message: repliedMessage, usage };
  const body = JSON.stringify({ receivedMessageId: repliedMessage.conversationId, data: params });
  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveProcesserResult`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body
  });
};
/**
 * 根据信息生成ai所需数组
 * @param appConfig  app配置
 * @param history  历史消息
 * @param question 当前消息
 * @returns 返回数组
 */

const GenerateArrayMessage = async (appConfig: DingTalkAppConfig, history: Message[], question: String) => {
  let promptTokens = 0;
  const messages = new Array();
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
  return messages;
}
/**
 * 多数据源信息整合到Message数据
 * @param param0 
 */
const finish = async ({ receivedMessageData, answer, app, usage, isAIAnswer, question }: {
  receivedMessageData: Message;
  answer: string;
  app: App;
  usage: Usage;
  isAIAnswer: boolean;
  question: String;
}): Promise<void> => {
  const repliedMessage = {
    senderUnionId: receivedMessageData?.senderStaffId || 'anonymous',
    sender: receivedMessageData?.senderNick || 'anonymous',
    content: question,
    answer: answer,
    appId: app.id,
    conversationId: receivedMessageData.unionMessageId,
    receivedMessageId: receivedMessageData.msgId,
    isAIAnswer: isAIAnswer,
    hasError: false,
  };
  await saveProcesserResult({ repliedMessage, usage });
}

const processMessage = async ({ receivedMessage, history, app, sensitiveWords }: MessageQueueBody) => {
  let answer = null;
  const appConfig = app.config as DingTalkAppConfig;
  //@ts-ignore
  const receivedMessageData = receivedMessage.data as ReceiveMessageData;
  const question = receivedMessageData.text.content;
  const messages = await GenerateArrayMessage(appConfig, history, question);
  if (sensitiveWords && sensitiveWords.length > 0) {
    answer = '你的提问中存在敏感词，系统忽略本消息。';
    await dingTalkMessageSend(app, answer, receivedMessageData, receivedMessageData.token);
    await finish({ receiveMessageData, answer, app, usage, isAIAnswer: false, question });
    return null;
  }
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
  answer = json.choices[0].message.content;
  const usage: Usage = {
    promptTokens: json.usage.prompt_tokens,
    completionTokens: json.usage.completion_tokens,
    totalTokens: json.usage.total_tokens,
  }
  await dingTalkMessageSend(app, answer, receivedMessageData, receivedMessageData.token);
  await finish({ receivedMessageData, answer, app, usage, isAIAnswer: true, question });
}




export { processMessage };

