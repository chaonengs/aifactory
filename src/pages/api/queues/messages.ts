import { Queue } from 'utils/quirrel/edge';
import { MessageQueueBody, processMessage } from 'processers/feishubot';


export default Queue(
  'api/queues/messages', // 👈 the route it's reachable on
  //@ts-ignore
  async (messageQueueBody: MessageQueueBody) => {
    try{
    return await processMessage(messageQueueBody);
    }
    catch(err ) {
          console.error(err);
          return new Response(
            JSON.stringify({ error: err.message }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
        }
  }
);


export const config = {
  runtime: 'edge',
};


