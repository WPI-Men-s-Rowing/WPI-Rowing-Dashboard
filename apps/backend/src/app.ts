import fastifyRateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { initServer } from "@ts-rest/fastify";
import { generateOpenApi } from "@ts-rest/open-api";
import contract from "api-schema";
import Fastify from "fastify";
import fastifyGracefulShutdown from "fastify-graceful-shutdown";
import fastifyHealthcheck from "fastify-healthcheck";
import env from "./env.js";
import prismaPlugin from "./plugins/prisma.ts";
import nkAccountsRouter from "./routes/nk-accounts.ts";

// Before anything else, try to verify that the env types are correct
const parsedEnv = env.safeParse(process.env);
if (!parsedEnv.success) {
  console.error(parsedEnv.error); // Log the environment failure
  process.exit(1); // Exit with an error code
}

// Map relating system type to logger. Recommended configuration per fastify
const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty", // This enables some nice things like coloring and removal of stuff we don't need. This is a dev dependency
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true, // Automatically enable in prod with full output
  test: false, // Disable in test
};

// Create the fastify server
const fastify = Fastify({
  logger: envToLogger[process.env.NODE_ENV], // Set the logger setting based on the current env
});

// Add the rate limiter
await fastify.register(fastifyRateLimit);

// Add the healthcheck
await fastify.register(fastifyHealthcheck);

// Add the graceful shutdown system
await fastify.register(fastifyGracefulShutdown);

// Setup the database
await fastify.register(prismaPlugin);

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
  // Only open up to allow all traffic in production - when a proxy is used to control traffic
  if (process.env.NODE_ENV == "production") {
    await fastify.listen({ port: process.env.PORT, host: "0.0.0.0" });
  } else {
    // In local development, we don't want that exposure
    await fastify.listen({ port: process.env.PORT });
  }
} catch (error) {
  fastify.log.error(error); // Log any failures
  process.exit(1); // Exit with an error code
}

// Export the fastify instance, so we can use it to get things
export default fastify;
