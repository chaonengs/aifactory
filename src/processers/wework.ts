import { AIResource, RecievedMessage, Message as PrismaMessage, Usage as PrismaUsage, App as PrismaApp } from '@prisma/client/edge';
import { encode } from 'gpt-tokenizer';
import { MessageQueueBody } from 'pages/api/queues/messages';
import { Usage } from 'types/openai';
import { WeworkAppConfig } from 'types/app';
import { Message } from 'types/wework';
import { OpenAIChatComletion, OpenAIRequest } from 'utils/server/openai';
import { WEWORK_PROXYED_BASE_URL } from 'utils/server/const';

const makeMessages = ({ recievedMessage, history, app }: MessageQueueBody) => {
  const appConfig = app.config as WeworkAppConfig;
  const receiveMessageData = recievedMessage.data as Message;
  const messages = new Array();

  let promptTokens = 0;
  const maxPromptTokens = appConfig.ai?.maxPromptTokens || 2000;
  for (let i = 0; i < history.length; i++) {
    const answerMessage = {
      role: 'assistant',
      content: history[i].answer
    };
    const answerTokens = encode(answerMessage.content).length;
    if (promptTokens + answerTokens > maxPromptTokens) {
      break;
    }
    promptTokens += answerTokens;
    messages.unshift(answerMessage);

    const contentMessage = {
      role: 'user',
      content: history[i].content
    };
    const conentTokens = encode(contentMessage.content).length;
    if (promptTokens + conentTokens > maxPromptTokens) {
      break;
    }
    promptTokens += conentTokens;
    messages.unshift(contentMessage);
  }

  const message = {
    role: 'user',
    content: receiveMessageData.Content
  };

  messages.push(message);
  return messages;
};

const getAccessToken = (appConfig: WeworkAppConfig) => {
  const url = `${WEWORK_PROXYED_BASE_URL}/cgi-bin/gettoken?corpid=${appConfig.corpId}&corpsecret=${appConfig.corpSecret}`;
  return fetch(url);
};

const getUser = (userId: String, accessToken: string) => {
  const url = `${WEWORK_PROXYED_BASE_URL}/cgi-bin/user/get?access_token=${accessToken}&userid=${userId}`;

  return fetch(url);
};

const sendWewokMessage = async (userId: string, answer: string, appConfig: WeworkAppConfig, accessToken: string) => {
  const body = {
    touser: userId,
    msgtype: 'text',
    agentid: appConfig.agentId,
    text: {
      content: answer
    }
  };

  const result = await fetch(`${WEWORK_PROXYED_BASE_URL}/cgi-bin/message/send?access_token=${accessToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return await result.json();
};

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
  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveProcesserResult`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
};

export const processMessage = async ({ recievedMessage, history, app }: MessageQueueBody) => {
  const appConfig = app.config as WeworkAppConfig;
  const receiveMessageData = recievedMessage.data as Message;

  const messages = makeMessages({ recievedMessage, history, app });
  if (!app.aiResource) {
    throw new Error('app has no resource');
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
  const result = await (await OpenAIChatComletion(params)).json();
  console.info(result);
  const answer = result.choices[0].message.content;
  const usage = result.usage as Usage;
  const accessToken = (await (await getAccessToken(appConfig)).json()).access_token;
  const user = await (await getUser(receiveMessageData.FromUserName, accessToken)).json();
  const weworkResult = await sendWewokMessage(receiveMessageData.FromUserName, answer, appConfig, accessToken);
  console.info(weworkResult);

  const repliedMessage = {
    senderUnionId: receiveMessageData.FromUserName,
    sender: user.name,
    content: receiveMessageData.Content,
    answer: answer,
    appId: app.id,
    conversationId: String(receiveMessageData.MsgId),
    recievedMessageId: String(receiveMessageData.MsgId)
  };
  await saveProcesserResult({ repliedMessage, app, usage, answer });
};
