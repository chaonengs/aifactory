import { Queue } from 'utils/quirrel/edge';
import { MessageQueueBody, processMessage } from 'processers/dingTalkBot';


export default Queue(
  'api/queues/messagesDingTalk', // 👈 the route it's reachable on
  //@ts-ignore
  async (messageQueueBody: MessageQueueBody) => {
    return await processMessage(messageQueueBody);
  }
);

export const config = {
  runtime: 'edge',
};

