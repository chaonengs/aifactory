# 基本信息
这是一个Next.js项目，可以部署到Vercel，依赖和使用的云服务包括
* Vercel
* PlanetScale
* Quirrel, Deployed on Fly.io and Upstash redis
* Prisma
* Github Oauth
* SMTP email login
* Feishu

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