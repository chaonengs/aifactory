import { AIResource, App, Message, Usage } from "@prisma/client";

export interface ProcessMessageBody {
    app: App;
    message: Message;
    aiResource: AIResource;
    usage: Usage;
}