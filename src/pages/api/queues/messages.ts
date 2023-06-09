import { Queue } from 'utils/quirrel/edge';
import { MessageQueueBody, processMessage } from 'processer/feishubot';


export default Queue(
  'api/queues/messages', // 👈 the route it's reachable on
  //@ts-ignore
  async (messageQueueBody: MessageQueueBody) => {
    return await processMessage(messageQueueBody);
  }
);


export const config = {
  runtime: 'edge',
};


