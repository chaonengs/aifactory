import "reflect-metadata";
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { resolvers } from "@generated/type-graphql";
import { buildSchema } from "type-graphql";
import { PrismaClient } from '@prisma/client'

const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

async function bootstrap() {
  // ... Building schema here
  const schema = await buildSchema({
    resolvers,
    validate: false,
  });
  // Create the GraphQL server
  const server = new ApolloServer({
    schema,
  });


  const { url } = await startStandaloneServer(server, {
    context: () => ({ prisma }),
    listen: { port: PORT },
  });
  console.log(`🚀 Server ready at ${url}`);
}

bootstrap();