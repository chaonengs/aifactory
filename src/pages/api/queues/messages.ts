import { Queue } from 'utils/quirrel/edge';
import { processMessage as processFeishu } from 'processers/feishubot';
import { processMessage as processWework } from 'processers/wework';

import { AIResource, App, Message, RecievedMessage } from '@prisma/client/edge';

export type MessageQueueBody = {
  recievedMessage: RecievedMessage;
  history: Message[];
  app: App & { aiResource: AIResource };
};

export default Queue(
  'api/queues/messages', // 👈 the route it's reachable on
  //@ts-ignore
  async (messageQueueBody: MessageQueueBody) => {
    try {
      if (messageQueueBody.recievedMessage.type === 'WEWORK') {
        return await processWework(messageQueueBody);
      }
      if (messageQueueBody.recievedMessage.type === 'FEISHU') {
        return await processFeishu(messageQueueBody);
      }
    } catch (err) {
      console.error(err);
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
