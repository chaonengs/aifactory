import { Message } from 'types/chat';
import { OpenAIModel } from 'types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from './const';

import { ParsedEvent, ReconnectInterval, createParser } from 'eventsource-parser';
import { SSEParser } from 'utils/sse';
import { decode } from 'punycode';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIChatComletion = (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  key: string,
  messages: Message[],
  stream: boolean = true
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'openai' &&
        OPENAI_ORGANIZATION && {
          'OpenAI-Organization': OPENAI_ORGANIZATION
        })
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      // max_tokens: 1024,
      temperature: temperature,
      stream: stream
    })
  });
};

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  key: string,
  messages: Message[],
  onData: ((data: string) => Promise<void>) ,
  onError: ((error: unknown) => Promise<void>) ,
  onComplete: (() => Promise<void>)
) => {
  const res = await OpenAIChatComletion(model, systemPrompt, temperature, key, messages);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(result.error.message, result.error.type, result.error.param, result.error.code);
    } else {
      throw new Error(`OpenAI API returned an error: ${decoder.decode(result?.value) || result.statusText}`);
    }
  }

  const result = new ReadableStream({
    async start(controller) {
        const SSEEvents = {
            onError: async (error: any) => {
              controller.error(error);
              await onError(error);
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

      if (res && res.body && res.ok) {
        const reader = res.body.getReader();
        while (true) {
            const { value, done } = await reader.read();
            console.log(value)
            console.log(done)

            if (done) break;
            const chunkValue = decoder.decode(value);
            console.log(chunkValue)
            sseParser.parseSSE(chunkValue);
      }
  
  



    //   for await (const chunk of res.body as any) {
    //     const decoded = decoder.decode(chunk);
    //     const parser = new SSEParser({onData, onError, onComplete})
    //     await parser.parseSSE(decoded);
        // const lines = decoded.split('\n').filter((line) => line.trim() !== '');

        // for (const line of lines) {
        //   const message = line.replace(/^data: /, '');
        //   if (message === '[DONE]') {
        //     if (onDone) {
        //       await onDone(airesult);
        //     }
        //     if (onComplete) {
        //       await onComplete(airesult, e);
        //     }
        //     controller.close();
        //   } else {
        //     try {
        //       const parsed = JSON.parse(message);
        //       const text = parsed.choices[0].delta.content;
        //       if (onData) {
        //         await onData(text);
        //       }
        //       const queue = encoder.encode(text);
        //       controller.enqueue(queue);
        //     } catch (e) {
        //     console.error(e);
        //     console.error(decoded);
        //       if (onError) {
        //         await onError(e);
        //       }
        //       if (onComplete) {
        //         await onComplete(airesult, e);
        //       }
        //       controller.error(e);
        //     }
        //   }
        // }
      }
    }
  });

  return result;
};
