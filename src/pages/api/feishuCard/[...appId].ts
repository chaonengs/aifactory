import { App, ChatSessionType, PrismaClient } from '@prisma/client';
import { NotFoundError } from '@prisma/client/runtime/library';
import { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { OpenAITemperature } from 'constant';
const prisma = new PrismaClient();

const findApp = async (id: string) => {
  return await prisma.app.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      aiResource: true
    }
  });
};
/**
 * 根据内容实现聊天模式创建或修改功能
 * @param app 应用信息
 * @param sender 用户id
 * @param groupId  分组id
 * @param action 内容实体
 */
const chatSessionInsertToUpdate = async (
  app: App,
  sender: string,
  groupId: string,
  action: JSON
) => {

  let datetime = new Date();
  let uuid = randomUUID();
  //获取客户操作value值
  let value = Number(action.option);
  let temperature = null;
  //根据客户操作value值读取json
  OpenAITemperature.forEach((item) => {
    if (item.value === value) {
      temperature = item.key;
    }
  })
  await prisma.chatSession.upsert({
    where: {
      groupId_sender_appId: {
        groupId: groupId,
        sender: sender,
        appId: app.id
      }
    },
    update: {
      createdAt: datetime,
      expiredAt: datetime,
      type: ChatSessionType.MUITIWHEEL,
      temperature: temperature
    },
    create: {
      createdAt: datetime,
      expiredAt: datetime,
      sender: sender,
      appId: app.id,
      organizationId: app.organizationId,
      groupId: groupId,
      type: ChatSessionType.MUITIWHEEL,
      conversationId: uuid,
      temperature: temperature
    }
  });
}
/**
 * 获取飞书调用，该接口对外提供
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { appId } = req.query;
  let id = null;
  if (Array.isArray(appId)) {
    id = appId[0];
  } else {
    id = appId;
  }
  if (!id) {
    res.status(404).end('not found');
    return;
  }

  let app;
  try {
    app = await findApp(id);
  } catch (e: unknown) {
    if (e instanceof NotFoundError) {
      res.status(404).end('not found');
      return
    } else {
      throw e;
    }
  }

  if (req.body && req.body['type'] && req.body['type'] === 'url_verification') {
    res.end(JSON.stringify({ challenge: req.body['challenge'] }));
  } else if (req.body && req.body['action']) {
    // 如果为下拉功能则实现聊天模式实现
    const action = req.body['action'];
    if (action['tag'] === 'select_static') {
      await chatSessionInsertToUpdate(app, req.body['open_id'], req.body['open_chat_id'], action);
    } 
    res.end('ok');
  }
};

