# 基本信息
这是一个Next.js项目，可以部署到Vercel，依赖和使用的云服务包括
* Vercel，你需要了解Next.js在Vercel上的运行方式，特别是Serverless的服务方式
* PlanetScale
* Quirrel(https://quirrel.dev/), Deployed on Fly.io and Upstash redis
* Prisma， 数据库ORM系统，支持Migrate, 务必看完Migrate方法和PlannetScale上的实践
* Github Oauth
* SMTP email login
* Feishu 开放平台

# 部署流程
1. 数据库
    1.a 准备一个数据库，线上项目采用的是PlanetScale，兼容MySql，你也用任何MySql数据库，
    1.b 配置数据库链接到.env 中的 DATABASE_URL
2. 搭建一个Quirrel服务，详细见官网https://quirrel.dev/， 线上采用了fly.io和upstash redis
    2.a 涉及环境变量
    ```
    QUIRREL_API_URL=
    QUIRREL_TOKEN=
    QUIRREL_BASE_URL=
    ```
3. 身份认证 - NextAuth
    3.a 系统支持两种认证方式，github和邮件认证，你可以都配置，也可以只配置一种。注意，不论配几种，你都需要先配置以下：
    ```
    # 配置系统部署的地址就行，比如本地默认的话就是 http://127.0.0.1:3000，线上配线上地址，详细看NextAuth文档
    NEXTAUTH_URL=
    # Linux: `openssl rand -hex 32` or go to https://generate-secret.now.sh/32
    NEXTAUTH_SECRET=
    ```
    你也可以查看NextAuth文档了解更多
    3.b
    若要支持github登录，请先前往github申请一个oauth应用，并配置
    ```
    GITHUB_ID=
    GITHUB_SECRET=
    ```
    3.c
    支持邮箱验证码登录，需要配置
    ```
    # Email Auth
    EMAIL_SERVER_USER=
    EMAIL_SERVER_PASSWORD=
    EMAIL_SERVER_HOST=
    EMAIL_SERVER_PORT=
    EMAIL_FROM=
    ```
4. 安装依赖，启动项目
    4.a 这是一个标准的Next.js项目，你可以自己本地运行，启动开发环境
    ```
    npm install
    npm run dev
    ```
    4.b 你也有将项目部署到Vercel上运行，详见Vercel官方说明, 代码为Vercel部署优化过，建议你还是去了解下Vercel上部署Next.js
5. 其他变量
    ```
    # FeiShu 登录项目，暂时没用
    FEISHU_APP_ID=
    FEISHU_APP_SECRET=

    # 默认的OpenAI和AzureOpenAI配置，可以不配，直接读取应用资源中的配置
    DEFAULT_OPENAI_URL=https://api.openai.com
    DEFUALT_OPEN_API_KEY=
    DEFAULT_AZ_OPENAI_URL=https://aifactory.openai.azure.com/openai/deployments/gpt-35-turbo
    DEFAULT_AZ_OPENAI_API_KEY=

    # REST TOTP SECRET
    # RESTful接口的TOTP密钥，保护接口安全的，可以不配置，目前版本接口安全较差，后续改进
    REST_TOTP_SECRET=
    DEVELOPMENT_MODE=
    ```

### fly.io
* 当前部署了quirrel
* ~~部署了Prisma Data Proxy测试项目，实际代码中没有用到，可以忽略~~

## ~~Prisma Data Proxy~~
~~为了解决Edge Runtime下调用数据库的问题~~
* ~~镜像 loxxo/aifactory-pdp:0.2.0~~
* ~~镜像有问题，工作不正常~~

## 飞书机器人
* /api/feishu/[appId]是飞书机器人接受飞书消息的入口，你可以查看/pages/api/feishu/[...apiId].ts去了解处理逻辑

## 如何开发新的机器人
* 在/pages/api目录下新建一个文件夹，比如 dingtalk
* dingtalk下新建[...appId].ts, 在此实现你的逻辑
* 新建一个表保存原始dingtalk的报文，和标记是否已处理
* 新建一个支持edge runtime下的消息处理器，位于/processers中，比如/processers/dingtalk.ts, 去处理的主要逻辑，包括询问OPENAI, dingtalk中发送消息等逻辑，要求通过ReadableStream的形式持续输出，不然可能会导致超时
* 在pages/api/queues/messages.ts中接受你在/pages/api/dingtalk/[...appId].ts中发送的queue请求，并使用你的处理器去处理消息、

### 操作数据库
* 如果你的机器人需要新增数据库表，请采用Prisma Migrate的方式，提供Migration文件

### 分支管理
* Main 和 Dev 分支都是被保护的，请新建分支后提交PR


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
* ~~根据飞书message中的root id去创建对话，并保存，以便在OpenAI中完整提交~~
* ~~支持添加AzureOpenAI~~
* ~~支持选择App的模型和温度~~
* ~~支持团队管理~~
* ~~支持用户使用自己的API KEY~~
* 支持飞书登录和更多第三方登录
* 优化卡片样式
* 各类监控
* REST API的安全问题