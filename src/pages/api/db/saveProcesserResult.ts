import { Message as PrismaMessage, AIResource, App } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { finishProcessing, logSensitiveWord, saveMessage } from "utils/db/transactions";


export type Message = {
    senderUnionId: string;
    sender:  string;
    content:  string;
    answer:  string;
    appId:  string;
    conversationId:  string;
    recievedMessageId:  string;
}

export type Usage = {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}


export type ProcessMessageBody = {
    message: Message;
    usage: Usage;
}

export type MessageDBSaveRequest = {
    data: ProcessMessageBody | undefined | null;
    recievedMessageId: string;
}


export default async (req: NextApiRequest, res: NextApiResponse) => {
    console.info(req.body);

    console.debug(req.body);
    const saveQuest = JSON.parse(req.body) as MessageDBSaveRequest;
    await finishProcessing(saveQuest.recievedMessageId );
    if(saveQuest.data){
        const [m, r, a] = await saveMessage(saveQuest.data.message, saveQuest.data.usage);
        await logSensitiveWord(m as PrismaMessage, (a as App).organizationId);
    }
}

