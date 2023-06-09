# 基本信息
这是一个Next.js项目，可以部署到Vercel，依赖和使用的云服务包括
* Vercel
* PlanetScale
* Quirrel, Deployed on Fly.io and Upstash redis
* Prisma
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


## 代码注意事项
已知
* Vercel edge runtime 不限制请求时长
* Vercel nodejs runtime, 也就是默认runtime最长请求10s， 30s，90s（根据收费版本）
* openai 的查询往往会很长，甚至超过90s
* edge模式不支持飞书sdk和prisma
结论
* 采用了quirrel queue的方式异步写入数据库
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