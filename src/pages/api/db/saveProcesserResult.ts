import { Message as PrismaMessage, AIResource, App } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { finishProcessing, logSensitiveWord, saveMessage } from "utils/db/transactions";


export type Message = {
    senderUnionId: string;
    sender: string;
    content: string;
    answer: string;
    appId: string;
    conversationId: string;
    receivedMessageId: string;
    isAIAnswer: boolean;
    hasError: boolean;
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
    receivedMessageId: string;
}


export default async (req: NextApiRequest, res: NextApiResponse) => {
    const saveQuest = req.body as MessageDBSaveRequest;
    await finishProcessing(saveQuest.receivedMessageId);
    if (saveQuest.data) {
        const [m, r, a] = await saveMessage(saveQuest.data.message, saveQuest.data.usage);
        await logSensitiveWord(m as PrismaMessage, (a as App).organizationId);
    }
    res.end('ok');
}

