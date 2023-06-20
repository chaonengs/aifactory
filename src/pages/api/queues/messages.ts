import { Queue } from 'utils/quirrel/edge';
import { MessageQueueBody, processMessage } from 'processers/feishubot';


export default Queue(
  'api/queues/messages', // 👈 the route it's reachable on
  //@ts-ignore
  async (messageQueueBody: MessageQueueBody) => {
    try{
    return await processMessage(messageQueueBody);
    }
    catch(err){
          console.error(err);
          return new Response(JSON.stringify(err), {status: 500});
        }
  }
);


export const config = {
  runtime: 'edge',
};


