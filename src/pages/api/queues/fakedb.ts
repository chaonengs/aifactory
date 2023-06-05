import { Queue } from "quirrel/vercel"
// import {  finishFeishuProcess, saveMessage } from "utils/db/transactions";
import { ProcessMessageBody } from "types/queue";

interface MessageDBSaveRequest {
    type: "save" | "update" | "finish";
    data: ProcessMessageBody | undefined | null;
    feishuMessageId: string | undefined | null;
}


export default Queue(
  "api/queues/db", // 👈 the route it's reachable on
  async ( request:MessageDBSaveRequest )=> {
    console.log(request);
    // if (request.type === 'finish' && request.feishuMessageId ){
    //     await finishFeishuProcess(request.feishuMessageId );
    // } else if(request.data){
    //     await saveMessage(request.data.message, request.data.app, request.data.aiResource, request.data.usage);
    // }
  }
)