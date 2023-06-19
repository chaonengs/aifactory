import { AIResource, App, Message, Usage } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import {  finishFeishuProcess, saveMessage } from "utils/db/transactions";

export type ProcessMessageBody = {
    app: App;
    message: Message;
    aiResource: AIResource;
    usage: Usage;
}

export type MessageDBSaveRequest = {
    data: ProcessMessageBody | undefined | null;
    feishuMessageId: string;
}


const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const saveQuest = JSON.parse(req.body) as MessageDBSaveRequest;
    await finishFeishuProcess(saveQuest.feishuMessageId );
    if(saveQuest.data){
        await saveMessage(saveQuest.data.message, saveQuest.data.app, saveQuest.data.aiResource, saveQuest.data.usage);
    }
    await finishFeishuProcess(saveQuest.feishuMessageId );
}
export default handler;

