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

export const ChatModeTypes=[
  {
    name:"帮助",
    message:"### 发送信息\n\n若您想给机器人发送信息，有如下两种方式：\n\n1. **群聊：** 在机器人所在群里 **@机器人** 后边跟着要提问的内容。\n\n2. **私聊：** 点击机器人的 **头像** 后，再点击 **发消息。** \n\n### 系统指令\n\n系统指令是一些特殊的词语，当您向机器人发送这些词语时，会触发对应的功能。\n\n**📢 注意：系统指令，即只发指令，没有特殊标识，也没有内容。**\n\n以下是系统指令详情：\n\n|    指令    |                     描述                     |                             示例                             |\n| :--------: | :------------------------------------------: | :----------------------------------------------------------: |\n|  **单聊**  | 每次对话都是一次新的对话，没有聊天上下文联系 | <details><br /><summary>预览</summary><br /><img src='https://cdn.staticaly.com/gh/eryajf/tu/main/img/image_20230404_193608.jpg'><br /></details> |\n|  **串聊**  |            带上下文联系的对话模式            | <details><br /><summary>预览</summary><br /><img src='https://cdn.staticaly.com/gh/eryajf/tu/main/img/image_20230404_193608.jpg'><br /></details> |\n|  **重置**  |        重置上下文模式，回归到默认模式        | <details><br /><summary>预览</summary><br /><img src='https://cdn.staticaly.com/gh/eryajf/tu/main/img/image_20230404_193608.jpg'><br /></details> |\n|  **帮助**  |                 获取帮助信息                 | <details><br /><summary>预览</summary><br /><img src='https://cdn.staticaly.com/gh/eryajf/tu/main/img/image_20230404_202336.jpg'><br /></details> |\n\n\n### 友情提示\n\n使用 **串聊模式** 会显著加快机器人所用账号的余额消耗速度，因此，若无保留上下文的需求，建议使用 **单聊模式。** \n\n即使有保留上下文的需求，也应适时使用 **重置** 指令来重置上下文。\n\n"
  },
  {
    name:"单聊",
    message:"[Concentrate] 现在进入与#name的单聊模式",
    type:1
  },
  {
    name:"串聊",
    message:"[Concentrate] 现在进入与#name的串聊模式",
    type:2
  },
]
//串聊时间限制
export const ChatModeDateTime= 10
