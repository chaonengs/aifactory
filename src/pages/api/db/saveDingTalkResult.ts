import { AIResource, App, Message, Usage } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import {  finishProcessing, logSensitiveWord, saveMessage } from "utils/db/transactions";

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


// const handler = async (body:JSON) => {
//     const saveQuest = body as MessageDBSaveRequest;

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const saveQuest = JSON.parse(req.body) as MessageDBSaveRequest;
    await finishProcessing(saveQuest.recievedMessageId );
    if(saveQuest.data){
        const [m, r, a] = await saveMessage(saveQuest.data.message, saveQuest.data.app, saveQuest.data.aiResource, saveQuest.data.usage);
        await logSensitiveWord(m as Message, (a as App).organizationId);
    }
}

