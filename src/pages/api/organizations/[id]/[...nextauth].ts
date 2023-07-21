import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient, Provider } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextAuthOptions } from 'next-auth';
import NextAuth, { getServerSession } from 'next-auth/next';
import FeishuProvider from 'nextauth/providers/feishu';

const prisma = new PrismaClient();

const generateProviders = async (providers: Provider[]) => {
  const authProviders = new Array();
  for (const provider of providers) {
    if (provider.type === 'FEISHU') {
      authProviders.push(
        FeishuProvider({
          clientId: provider.cliendId,
          clientSecret: provider.clientSecret
        })
      );
    }
  }
  return authProviders;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (!req.query.id) {
    res.status(404).end('organization not found');
    return;
  }
  const organization = await prisma.organization.findUniqueOrThrow({
    where: {
      id: req.query.id as string
    },
    include: {
      providers: true
    }
  });

  const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: await generateProviders(organization.providers)
  };

  NextAuth(req, res, authOptions);


};
