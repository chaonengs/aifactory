export type AppAIConfig = {
    temprature:number,
    maxPromptTokens:number,
    maxCompletionTokens: number,
}

export type FeishuBotConfig = {
    appId:string,
    appSecret: string,
    encryptKey: string,
    verificationToken:string,
    ai:AppAIConfig,
}