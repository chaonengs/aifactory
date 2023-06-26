import { ReactElement } from "react";

export const LAYOUT: any = {
  main: 'main',
  noauth: 'noauth',
  minimal: 'minimal'
};

export interface Props {
  children: ReactElement;
  variant?: "main" | "minimal" | "noauth";
}
export default LAYOUT;

export const ResourceTypes = [
  {
    code:"OPENAI",
    name:"OpenAI",
  },
  {
    code:"AZ_OPENAI",
    name:"Azure OpenAI",
  },
  {
    code:"SELF_HOST_OPENAI",
    name:"平台OpenAI",
  },
];

export const AIResourceTypes = {
  "OPENAI" : "OpenAI",
  "AZ_OPENAI": "Azure OpenAI",
  "SELF_HOST_OPENAI": "平台OpenAI",
}

export const OpenAIModels = [
  "gpt-3.5-turbo",
  "gpt-4",
  "gpt-4-0314",
  "gpt-4-32k",
  "gpt-4-32k-0314",
  "gpt-3.5-turbo-0301"
]

export const AZApiVersions = [
  "2023-03-15-preview",
  "2023-05-15",
  "2023-06-01-preview",
]

export const AppAIConfigDefaults = {
  temprature: 1.0,
  maxPromptTokens: 2000,
  maxCompletionTokens: 2000,
}

export const AppTypes = {
  "FEISHU": "飞书机器人",
  "WEWORK": "企业微信机器人",
  "DINGTALK": "钉钉机器人",
}