import 'reflect-metadata';
import { ApolloServer, ContextFunction } from '@apollo/server';
import { resolvers } from '@generated/type-graphql';
import { buildSchemaSync } from 'type-graphql';
import { PrismaClient } from '@prisma/client';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

const prisma = new PrismaClient();

const schema = buildSchemaSync({
    resolvers,
    validate: false,
  });

const server = new ApolloServer(
    {
        schema,
    } );

// }
export default startServerAndCreateNextHandler(server, {context: async (req, res) => ({ req, res, prisma })});
