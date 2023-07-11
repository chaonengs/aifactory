import { ChatSessionType } from "@prisma/client";
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
    code: "OPENAI",
    name: "OpenAI",
  },
  {
    code: "AZ_OPENAI",
    name: "Azure OpenAI",
  },
  {
    code: "SELF_HOST_OPENAI",
    name: "平台OpenAI",
  },
];

export const AIResourceTypes = {
  "OPENAI": "OpenAI",
  "AZ_OPENAI": "Azure OpenAI",
  "SELF_HOST_OPENAI": "平台OpenAI",
}

export const OpenAIModels = [
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
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

export const ChatModeTypes = [
  {
    name: ["帮助", "/help"],
    message: "### 开启多轮对话\n\n * 使用/start或者开始，开启多轮对话\n\n * 使用/end或者关闭，关闭多轮对话\n\n * 使用/reset或者重置，开启新一轮对话"
  },
  {
    name: ["关闭", "/end"],
    message: "**Hi，#name。欢迎回到单轮对话模式**\n\n>",
    type: ChatSessionType.SINGLEWHEEL
  },
  {
    name: ["开始", "/start"],
    message: "**Hi，#name，欢迎使用多轮对话，请开始你的提问**\n\n>#time分钟后将恢复单轮对话模式，如需退出，请单独输入“/end”或者“关闭”，如需开启全新多轮对话，请输入“/reset”或者“重置”",
    type: ChatSessionType.MUITIWHEEL
  },
  {
    name: ["重置", "/reset"],
    message: "**Hi，#name。历史消息已清空**\n\n> [RecyclingSymbol]可以开始新的对话啦",
    type: 'RESET'
  }
]
//串聊时间限制
export const ChatModeDateTime = 10
export const chatTemplate = {
  OpenWord: "思考中，请稍候",
  ExpireWord: "Hi，#name，当前已经恢复至单轮对话模式"
}
//AI 飞书模块可选择temperature值
export const OpenAITemperature = [
  {
    key: "k1",
    text: "更有创造力",
    value: 1.0
  },
  {
    key: "k2",
    text: "更平衡",
    value: 0.7
  },
  {
    key: "k3",
    text: "更精准",
    value: 0.1
  }
]
export const chatModeHistory = {
  name: ['摘要', '/summary'],
  message: '根据以上会话记录，希望你能够对这些记录进行摘要。要求简明扼要，以包含列表的大纲形式输出。',
  during: 7 * 24 * 60 * 60,
  size: 100
}