import { Queue } from 'utils/quirrel/edge';
import { processMessage as processFeishu } from 'processers/feishubot';
import { processMessage as processWework } from 'processers/wework';
import { processMessage as processDingTalk } from 'processers/dingTalkBot';
import { AIResource, App, Message, ReceivedMessage, SensitiveWord } from '@prisma/client/edge';
import * as Sentry from "@sentry/nextjs";

export type MessageQueueBody = {
  receivedMessage: ReceivedMessage;
  history: Message[];
  app: App & { aiResource: AIResource };
  sensitiveWords: SensitiveWord[] | null | undefined;
};

export default Queue(
  'api/queues/messages', // 👈 the route it's reachable on
  //@ts-ignore
  async (messageQueueBody: MessageQueueBody) => {
    try {
      if (messageQueueBody.receivedMessage.type === 'WEWORK') {
        const result = await processWework(messageQueueBody);
        if (result) {
          return result;
        } else {
          return new Response('ok');
        }
        
      }
      if (messageQueueBody.receivedMessage.type === 'DINGTALK') {
        const result = await processDingTalk(messageQueueBody);
        if (result) {
          return result;
        } else {
          return new Response('ok');
        }
      }
      if (messageQueueBody.receivedMessage.type === 'FEISHU') {
        const result = await processFeishu(messageQueueBody);
        if (result) {
          return result;
        } else {
          return new Response('ok');
        }
      }
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);

      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    }
  }
);

export const config = {
  runtime: 'edge'
};
