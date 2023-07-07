import { Message } from 'types/chat';
import { OpenAIModel, OpenAIModelID, OpenAIModels } from 'types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from './const';

import { ParsedEvent, ReconnectInterval, createParser } from 'eventsource-parser';
import { SSEParser } from 'utils/sse';
import { decode } from 'punycode';
import { number } from 'yup';
import * as Sentry from "@sentry/nextjs";

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;
  request: any;

  constructor(message: string, type: string, param: string, code: string, request: any) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
    this.request = request;
  }
}

export type OpenAIRequest = {
  hostUrl: string | undefined | null;
  type: string | undefined | null;
  apiVersion: string | undefined | null;
  model: string | undefined | null;
  systemPrompt: string | undefined | null;
  temperature: number | undefined | null;
  key: string;
  messages: Message[];
  stream: boolean | undefined | null;
  maxTokens: number  | undefined | null;
  maxPromptTokens: number  | undefined | null;
}

const createOpenAIRequest = (request:any) => {
  let url = request.hostUrl;
  let type = request.type;
  if (!type){
    type = 'OPENAI'
  }
  if(!request.type || request.type === 'OPENAI'){
    url = url || process.env.OPENAI_API_HOST || 'https://api.openai.com';
    url = `${url}/v1/chat/completions`;
  }
  else if (request.type === 'AZ_OPENAI'){
    url = url || process.env.AZ_OPENAI_API_HOST;
    let apiVerison  = request.apiVersion || 'api-version=2023-03-15-preview'
    url = `${url}/chat/completions?api-version=${request.apiVersion}`;
  }
    
  if(!url){
    throw new Error('OpenAI Url not set');
  }

  let model = OpenAIModels[OpenAIModelID.GPT_3_5];
  const temperature = request.temperature === null ? (
    process.env.DEFUALT_TEMPERATURE === null || process.env.DEFUALT_TEMPERATURE === '' ? 1.0 :
    Number.parseFloat(process.env.DEFUALT_TEMPERATURE as string)) : request.temperature;

  let stream = request.stream;
  if(stream === null || stream === undefined){
    stream = true;
  }
  // const openAiRequest: OpenAIRequest = {
  //   hostUrl: url,
  //   apiType: apiType,
  //   stream: stream,
  //   model:model,
  //   temperature: temperature,
  //   key:request.key,
  //   maxTokens: request.maxTokens,
  //   promptMaxTokens: 

  // };

}

export const OpenAIChatComletion = (request : OpenAIRequest) => {

  let url = request.hostUrl;
  let type = request.type;
  if (!type){
    type = 'OPENAI'
  }
  if(!request.type || request.type === 'OPENAI'){
    url = url || process.env.DEFAULT_OPENAI_URL || 'https://api.openai.com';
    url = `${url}/v1/chat/completions`;
  }
  else if (request.type === 'AZ_OPENAI'){
    url = url || process.env.DEFAULT_AZ_OPENAI_URL;
    let apiVersion  = request.apiVersion || '2023-03-15-preview'
    url = `${url}/chat/completions?api-version=${apiVersion}`;
  }
    
  if(!url){
    throw new Error('OpenAI Url not set');
  }

  const temperature = request.temperature === null ? (
    process.env.DEFUALT_TEMPERATURE === null || process.env.DEFUALT_TEMPERATURE === '' ? 1.0 :
    Number.parseFloat(process.env.DEFUALT_TEMPERATURE as string)) : request.temperature;

  let stream = request.stream;
  if(stream === null || stream === undefined){
    stream = true;
  }
  
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(type === 'OPENAI' && {
      Authorization: `Bearer ${request.key ? request.key : process.env.DEFAULT_OPENAI_API_KEY}`
    }),
    ...(type === 'AZ_OPENAI' && {
      'api-key': `${request.key ? request.key : process.env.DEFAULT_AZ_OPENAI_API_KEY}`
    }),
    ...(type === 'SELF_HOST_OPENAI' && {
      Authorization: `Bearer ${request.key ? request.key : process.env.DEFAULT_OPENAI_API_KEY}`
    }),
    ...(type === 'OPENAI' &&
      OPENAI_ORGANIZATION && {
        'OpenAI-Organization': OPENAI_ORGANIZATION
      })
  }

  const requestBody = {
    ...(type === 'OPENAI' && { model: request.model || 'gpt-3.5-turbo'}),
    ...(request.maxTokens && {max_tokens: request.maxTokens}),
    messages: [
      // {
      //   role: 'system',
      //   content: systemPrompt
      // },
      ...request.messages
    ],
    // max_tokens: 1024,
    temperature: temperature,
    stream: stream,
  };

  console.log(requestHeaders)
  console.log(requestBody)
  
  return fetch(url, {
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
};

export const OpenAIStream = async (
  params: OpenAIRequest,
  onData: ((data: string) => Promise<void>) ,
  onError: ((error: unknown) => Promise<void>) ,
  onComplete: (() => Promise<void>)
) => {
  const res = await OpenAIChatComletion(params);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    console.error(res);
    Sentry.captureException(new Error(`Open AI request error: ${res.status} - ${await res.text()}` ));

    const result = await res.text();

    try{
      const resultJson = JSON.parse(result);
      await onError(resultJson);
      await onComplete();
      if (resultJson.error) {
        throw new OpenAIError(resultJson.error.message, resultJson.error.type, resultJson.error.param, resultJson.error.code, params);
      } else {
        throw new Error(`OpenAI API returned an error: ${result}`);
      }
    }
    catch(e){
      await onError(result);
      await onComplete();
      throw new Error(`OpenAI API returned an error: ${result}`);
    }
  }

  const result = new ReadableStream({
    async start(controller) {
        const SSEEvents = {
            onError: async (error: any) => {
              controller.error(error);
              await onError(error);
              controller.close();
            },
            onData: async (data: string) => {
              const queue = new TextEncoder().encode(data);
              await onData(data);
              const encoded = encoder.encode(data);
              controller.enqueue(encoded);
            },
            onComplete: async () => {
            await onComplete();
              controller.close();
            },
          };


      const sseParser = new SSEParser(SSEEvents);
      // console.log(res);
      if (res && res.body && res.ok) {
        const reader = res.body.getReader();
        while (true) {
            const { value, done } = await reader.read();
            // console.log(value)
            // console.log(done)

            if (done) break;
            const chunkValue = decoder.decode(value);
            // console.log(chunkValue)
            await sseParser.parseSSE(chunkValue);
      }
      }
    }
  });

  return result;
};
