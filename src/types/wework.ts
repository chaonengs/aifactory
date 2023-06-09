import { AppAIConfig } from "./app";

export type AppConfig = {
    token: string;
    encodingAESKey: string;
    corpId: string;
    corpSecret: string;
    agentId: string;
    ai: AppAIConfig;
}

/*
<xml>
   <ToUserName><![CDATA[toUser]]></ToUserName>
   <FromUserName><![CDATA[fromUser]]></FromUserName> 
   <CreateTime>1348831860</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[this is a test]]></Content>
   <MsgId>1234567890123456</MsgId>
   <AgentID>1</AgentID>
</xml>
*/

export type Message = {
    ToUserName: string,
    FromUserName:string,
    CreateTime:number,
    MsgType:string,
    Content:string,
    MsgId:string,
    AgentID:number,
}