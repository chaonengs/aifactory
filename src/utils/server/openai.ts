import { Message } from 'types/chat';
import { OpenAIModel } from 'types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from './const';

import { ParsedEvent, ReconnectInterval, createParser } from 'eventsource-parser';

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
  onDataHandler: ((text: string) => {}) | null = null,
  onDoneHandler: ((text: string) => {}) | null = null,
  onErrorHandler: ((error: any) => {}) | null = null,
  onCompleteHandler: ((text: string, error: any) => {}) | null = null
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
      let result = '';
      let error: any;
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          try {
            const json = JSON.parse(data);
            if (json.choices[0].finish_reason != null) {
              controller.close();
              if (onDoneHandler) {
                onDoneHandler(result);
              }
              return;
            }
            const text = json.choices[0].delta.content;
            if (onDataHandler) {
              onDataHandler(text);
            }
            result += text;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            error = e;
            if (onErrorHandler) {
              onErrorHandler(e);
            }
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }

      if (onCompleteHandler) {
        onCompleteHandler(result, error);
      }
    }
  });

  return result;
};
