import 'reflect-metadata';
import { ApolloServer, ContextFunction } from '@apollo/server';
import { resolvers } from '@generated/type-graphql';
import { buildSchemaSync } from 'type-graphql';
import { PrismaClient } from '@prisma/client';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { totp } from 'otplib';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

const schema = buildSchemaSync({
  resolvers,
  validate: false
});

const server = new ApolloServer({
  schema, 
  introspection: true,
});

export default startServerAndCreateNextHandler(server, {
  context: async (req, res) => ({ req, res, prisma }),
});

// const handler = (req: NextApiRequest, res: NextApiResponse) => {
//   const graphqlHandler = startServerAndCreateNextHandler(server, { context: async (req, res) => ({ req, res, prisma }) });

//   if (process.env.DEVELOPMENT_MODE === 'true') {
//     return graphqlHandler(req, res);
//   }
//   if (req.headers['totp']) {
//     const secret = process.env.REST_TOTP_SECRET;
//     if (totp.check(req.headers['totp'], process.env.REST_TOTP_SECRET)) {
//       return graphqlHandler(req, res);
//     }
//   }

//   res.status(401).send('not permitted');
//   return;
// };

// export default async (req: NextApiRequest, res: NextApiResponse) => {
//   startServerAndCreateNextHandler(server, { context: async (req, res) => ({ req, res, prisma }) });
  // if (process.env.DEVELOPMENT_MODE === 'true') {
  //   startServerAndCreateNextHandler(server, { context: async (req, res) => ({ req, res, prisma }) });
  //    return;
  // }
  // if (req.headers['totp']) {
  //   const secret = process.env.REST_TOTP_SECRET;
  //   if (totp.check(req.headers['totp'], process.env.REST_TOTP_SECRET)) {
  //     startServerAndCreateNextHandler(server, { context: async (req, res) => ({ req, res, prisma }) });
  //      return;
  //   }
  // }

  // res.status(401).send('not permitted');
  // return;
// }
