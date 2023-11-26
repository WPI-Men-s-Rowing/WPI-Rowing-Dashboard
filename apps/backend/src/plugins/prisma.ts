import { PrismaClient } from "database";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// On startup, connect to prisma, on shutdown, disconnect from prisma
const prismaPlugin: FastifyPluginAsync = fp(async (server) => {
  const prisma = new PrismaClient();

  await prisma.$connect();

  // Make Prisma Client available through the fastify server instance: server.prisma
  server.decorate("prisma", prisma);

  server.log.info("Successfully connected to database instance");

  server.addHook("onClose", async (server) => {
    await server.prisma.$disconnect();
    server.log.info("Successfully disconnected from database instance");
  });
});

export default prismaPlugin;
