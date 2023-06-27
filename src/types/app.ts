export type AppAIConfig = {
  temperature: number;
  maxPromptTokens: number;
  maxCompletionTokens: number;
};

export type FeishuAppConfig = {
  appId: string;
  appSecret: string;
  encryptKey: string;
  verificationToken: string;
  ai: AppAIConfig;
};

export type WeworkAppConfig = {
  token: string;
  encodingAESKey: string;
  corpId: string;
  corpSecret: string;
  agentId: string;
  ai: AppAIConfig;
};
export type DingTalkAppConfig = {
  appId: string;
  appSecret: string;
  ai: AppAIConfig;
};
