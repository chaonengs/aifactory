import { Queue } from 'quirrel/next';
import { processFeishuMessage } from '../process/[...messageId]';
import { AIResource, App, FeiShuMessage } from '@prisma/client';

export interface MessageQueueBody {
  feishuMessage: FeiShuMessage;
  app: App & { aiResource: AIResource };
}

export default Queue(
  'api/queues/messages', // 👈 the route it's reachable on
  async (messageQueueBody: MessageQueueBody) => {
    await processFeishuMessage(messageQueueBody.feishuMessage, messageQueueBody.app);
  }
);


export const config = {
  runtime: 'edge',
};