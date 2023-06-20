import { Queue } from 'utils/quirrel/edge';
import { MessageQueueBody, processMessage } from 'processers/feishubot';
import { NextResponse } from 'next/server';


export default Queue(
  'api/queues/messages', // 👈 the route it's reachable on
  //@ts-ignore
  async (messageQueueBody: MessageQueueBody) => {
    try{
    return await processMessage(messageQueueBody);
    }
    catch(err ) {
          console.error(err);
          return NextResponse.json({ error: err.message }, { status: 500 })
        }
  }
);


export const config = {
  runtime: 'edge',
};


