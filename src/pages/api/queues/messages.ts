import { Queue } from 'utils/quirrel/edge';
import { processFeishuMessage } from '../process/[...messageId]';

export interface MessageQueueBody {
  feishuMessage;
  app;
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