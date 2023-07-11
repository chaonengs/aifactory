import { App, ReceivedMessage, SensitiveWord } from '@prisma/client/edge';
import { encode } from 'gpt-tokenizer';
import { MessageDBSaveRequest, Message as MessageToSave, Usage as UsageToSave } from 'pages/api/db/saveProcesserResult';
import { MessageQueueBody } from 'pages/api/queues/messages';
import { WeworkAppConfig } from 'types/app';
import { Usage } from 'types/openai';
import { Message } from 'types/wework';
import { WEWORK_PROXYED_BASE_URL } from 'utils/server/const';
import { OpenAIChatComletion, OpenAIRequest, OpenAIStream } from 'utils/server/openai';

const makeMessages = ({ receivedMessage, history, app }: MessageQueueBody) => {
  const appConfig = app.config as WeworkAppConfig;
  const receiveMessageData = receivedMessage.data as Message;
  const messages = new Array();

  let promptTokens = 0;
  promptTokens = encode(receiveMessageData.Content).length;

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
  return {messages, promptTokens};
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

const saveProcesserResult = async ({ repliedMessage, usage }: { repliedMessage: MessageToSave; usage: UsageToSave }) => {
  const params: MessageDBSaveRequest = {
    receivedMessageId: repliedMessage.receivedMessageId,
    data: {
      message: repliedMessage,
      usage: usage
    }
  };
  const url = `${process.env.QUIRREL_BASE_URL}/api/db/saveProcesserResult`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
};

const finish = async ({receivedMessage, user, answer, app, sensitiveWords, usage, isAIAnswer, hasError}:{
  receivedMessage: ReceivedMessage;
  user: any;
  answer: string;
  app: App;
  sensitiveWords: SensitiveWord[] | null | undefined;
  usage: Usage;
  isAIAnswer: boolean;
  hasError: boolean;
}): Promise<void> => {
    const receiveMessageData = receivedMessage.data as Message;
    const repliedMessage = {
      senderUnionId: receiveMessageData.FromUserName,
      sender: user?.name,
      content: receiveMessageData.Content,
      answer: answer,
      appId: app.id,
      conversationId: receivedMessage.conversationId ||  String(receiveMessageData.MsgId),
      receivedMessageId: String(receiveMessageData.MsgId),
      isAIAnswer: isAIAnswer,
      hasError: false,
    };
    if(repliedMessage.sender === null || repliedMessage.sender === undefined || repliedMessage.sender === ''){
      repliedMessage.sender = receiveMessageData.FromUserName;
    }
    await saveProcesserResult({ repliedMessage, usage });
  }

export const processMessage = async ({ receivedMessage, history, app, sensitiveWords }: MessageQueueBody) => {

  const appConfig = app.config as WeworkAppConfig;
  if (!app.aiResource) {
    throw new Error('app has no resource');
  }
  const receiveMessageData = receivedMessage.data as Message;
  const accessToken = (await (await getAccessToken(appConfig)).json()).access_token;
  const user = await (await getUser(receiveMessageData.FromUserName, accessToken)).json();
  console.log(user);

  let answer = '';
  let usage:Usage = {
    promptTokens: 0,
    completionTokens:  0,
    totalTokens: 0
  }
  if(sensitiveWords && sensitiveWords.length > 0) {
    answer = '你的提问中存在敏感词，系统忽略本消息。';
    await sendWewokMessage(receiveMessageData.FromUserName, answer, appConfig, accessToken);
    await finish({receivedMessage, user, answer, app, sensitiveWords, usage, isAIAnswer: false, hasError: false});
    return null;
  }
  
  const {messages, promptTokens} = makeMessages({ receivedMessage, history, app, sensitiveWords });
  usage.promptTokens = promptTokens;
  // await sendWewokMessage(receiveMessageData.FromUserName, "正在生成内容...", appConfig, accessToken);


  //@ts-ignore
  const aiResource = app.aiResource as AIResource;
  const params: OpenAIRequest = {
    model: aiResource.model,
    key: aiResource.apiKey,
    hostUrl: aiResource.hostUrl,
    type: aiResource.type,
    apiVersion: aiResource.apiVersion,
    maxTokens: appConfig.ai?.maxCompletionTokens || 2000,
    temperature: appConfig.ai?.temperature || 1,
    maxPromptTokens: appConfig.ai?.maxPromptTokens || 2000,
    messages: messages,
    systemPrompt: null,
    stream: true
  };
  const openaiStream = OpenAIStream(
    params,
    async (data) => { 
      usage.completionTokens += 1;
      if (data) {
        answer += data;
      }
    },
    async (error) => {
      console.error(error);
      await sendWewokMessage(receiveMessageData.FromUserName, `${answer}\n[遇到错误，中止生成]`, appConfig, accessToken);
      await finish({receivedMessage, user, answer, app, sensitiveWords, usage, hasError:true, isAIAnswer:true});
    },
    async () => {
      await sendWewokMessage(receiveMessageData.FromUserName, `${answer}\n[回复完成]`, appConfig, accessToken);
      await finish({receivedMessage, user, answer, app, sensitiveWords, usage, hasError:false, isAIAnswer:true});
    }
  );
  return openaiStream;
};
