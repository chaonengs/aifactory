import { AIResource, App, PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai-streams/node';

import { encode } from 'gpt-tokenizer';
import { createMessage } from 'utils/db/transactions';

const prisma = new PrismaClient();

const findApp = async (id: string) => {
  return await prisma.app.findUnique({
    where: {
      id
    },
    include: {
      aiResource: true
    }
  });
};



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { appId } = req.query;
  let id = null;
  if (Array.isArray(appId)) {
    id = appId[0];
  } else {
    id = appId;
  }
  if (id) {
    const app = await findApp(id);
    if (app === null) {
      res.status(404).end('not found');
    } else {
      const stream = await OpenAI(
        'chat',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: req.body
            }
          ]
        },
        { apiKey: app.aiResource.apiKey, mode: 'tokens' }
      );
      let result;
      let completionTokens = 0;
      stream.on('data', (data) => {
        const decoder = new TextDecoder();
        completionTokens += 1;
        if (result) {
          result += decoder.decode(data);
        } else {
          result = decoder.decode(data);
        }
        res.write(data);
      });
      stream.on('end', async () => {
        await createMessage(req.body, result, 'anonymous', 'anonymous', encode(req.body).length, completionTokens, app);
        res.end();
      });
      // stream.pipe(res);
      // stream.on
      // res.end();
    }
  } else {
    res.status(404).end('not found');
  }
}
