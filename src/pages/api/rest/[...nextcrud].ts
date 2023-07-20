import NextCrud, { PrismaAdapter } from '@premieroctet/next-crud';
import { Prisma, PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

import { authOptions } from 'pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

import { totp } from 'otplib';
// const token = totp.generate(process.env.REST_TOTP_SECRET);
// const isValid = totp.check(token, secret);
// const isValid = totp.verify({ token, secret });

const prismaClient = new PrismaClient();
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let authorized = false;
  if (!authorized && process.env.DEVELOPMENT_MODE === 'true') {
    authorized = true;
  }
  if (!authorized && process.env.DEVELOPMENT_MODE === 'true') {
    authorized = true;
  }
  if (!authorized) {
    const session = await getServerSession(req, res, authOptions);
    if (session) {
      authorized = true;
    }
  }
  if (!authorized) {
    if (req.headers['totp'] && process.env.REST_TOTP_SECRET) {
      if (totp.check(req.headers['totp'] as string, process.env.REST_TOTP_SECRET)) {
        authorized = true;
      }
    }
  }

  if (!authorized) {
    res.status(401).send('not permitted');
    return;
  }

  const nextCrudHandler = await NextCrud({
    adapter: new PrismaAdapter({
      prismaClient: prismaClient
    })
  });

  if (req.query.nextcrud?.length === 3 && req.query.nextcrud[0] === 'organizationUsers' && req.method === 'DELETE') {
    await prismaClient.organizationUsers.delete({
      where: {
        userId_organizationId: {
          userId: req.query.nextcrud[2],
          organizationId: req.query.nextcrud[1],
        }
      }
    });
    res.status(204).end();
    return;
  }
  return nextCrudHandler(req, res);
};
export default handler;
