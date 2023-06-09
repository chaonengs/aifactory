# 基本信息
这是一个Next.js项目，可以部署到Vercel，依赖和使用的云服务包括
* Vercel，你需要了解Next.js在Vercel上的运行方式，特别是Serverless的服务方式
* PlanetScale
* Quirrel, Deployed on Fly.io and Upstash redis
* Prisma， 数据库ORM系统，支持Migration
* Github Oauth
* SMTP email login
* Feishu

## Prisma Data Proxy
为了解决Edge Runtime下调用数据库的问题
* 镜像 loxxo/aifactory-prisma-data-proxy:0.2.0
* env
** DATABASE_URL
** DATA_PROXY_API_KEY=randomstring
### fly.io

## 如何开发新的机器人
* 在/pages/api目录下新建一个文件夹，比如 dingtalk
* dingtalk下新建[...appId].ts, 在此实现你的逻辑
* 新建一个表保存原始dingtalk的报文，和标记是否已处理
* 新建一个支持edge runtime下的消息处理器，位于/processers中，比如/processers/dingtalk.ts, 去处理的主要逻辑，包括询问OPENAI, dingtalk中发送消息等逻辑，要求通过ReadableStream的形式持续输出，不然可能会导致超时
* 在pages/api/queues/messages.ts中接受你在/pages/api/dingtalk/[...appId].ts中发送的queue请求，并使用你的处理器去处理消息


## 代码注意事项
已知
* Vercel edge runtime 不限制请求时长
* Vercel nodejs runtime, 也就是默认runtime最长请求10s， 30s，90s（根据收费版本）
* openai 的查询往往会很长，甚至超过90s
* edge模式不支持飞书sdk和prisma (可以采用prisma data proxy)
实现方案
* 收到飞书消息，确认参数后保存报文，然后响应成功，再通过quirrel任务完成飞书消息的处理，需要调用数据库的时候，采用http api形式。
* quirrel队列中会包含消息体和app密钥等敏感信息，但queue对消息是有加密传输的
* 在edge runtime中不采用飞书sdk，自己用的fetch实现



## 开发路线
* 根据飞书message中的root id去创建对话，并保存，以便在OpenAI中完整提交
* 支持添加AzureOpenAI
* 支持选择App的模型和温度
* 支持团队管理
* 支持用户使用自己的API KEY
* 支持飞书登录和更多第三方登录
* 优化卡片样式
* 各类监控
* REST API的安全问题