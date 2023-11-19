import fastifyRateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { initServer } from "@ts-rest/fastify";
import { generateOpenApi } from "@ts-rest/open-api";
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

// If we're in the dev environment, host the fastify swagger UI
if (process.env.NODE_ENV == "development") {
  // Now generate the open API schema
  const openApiDocument = generateOpenApi(contract, {
    info: {
      title: "WPI Rowing Dash API",
      version: "1.0.0",
      baseUrl: "http://localhost:3000",
    },
  });

  // Now bind the open API schmea
  await fastify
    .register(fastifySwagger, {
      transformObject: () => openApiDocument,
    })
    .register(fastifySwaggerUI);
}

// Now, try starting it up
try {
  await fastify.listen({ port: 3000 });
} catch (error) {
  fastify.log.error(error);
}
