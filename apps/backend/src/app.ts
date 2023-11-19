import fastifyRateLimit from "@fastify/rate-limit";
import { initServer } from "@ts-rest/fastify";
import contract from "api-schema";
import Fastify from "fastify";
import nkAccountsRouter from "./routes/nk-accounts.ts";

// Create the fastify server
const fastify = Fastify({
  logger: true,
});

// Add the rate limiter
await fastify.register(fastifyRateLimit);

// Setup the ts-rest schema
const schemaServer = initServer();

const schemaRouter = schemaServer.router(contract, {
  nkAccounts: nkAccountsRouter,
});

// Bind the ts-rest stuff to fastify, including config
schemaServer.registerRouter(contract, schemaRouter, fastify, {
  responseValidation: true,
  logInitialization: true,
});

// Now, try starting it up
try {
  await fastify.listen({ port: 3000 });
} catch (error) {
  fastify.log.error(error);
}
