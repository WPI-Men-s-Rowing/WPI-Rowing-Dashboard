import { createTerminus } from "@godaddy/terminus";
import { prisma } from "database";
import http from "http";
import { AddressInfo } from "net";
import app from "../app.ts";

// Attempt a database connection
console.info("Connecting to database...");
try {
  // This intrinsically connects to the database and runs a test to make sure it works
  await prisma.$executeRaw`select 1`;
  console.log("Successfully connected to the database");
} catch (error) {
  // Log any errors
  const printableError = error as Error;
  console.error(
    "Unable to establish database connection: " + printableError.message,
  );
  process.exit(1); // Then exit
}

// Get port from environment and store in Express. If there's no port (e.g., dev), default to 3001
// eslint-disable-next-line turbo/no-undeclared-env-vars
const port = process.env.PORT ?? 3001;

app.set("port", port);

// Create the server, enable the application
console.info("Starting server...");
const server: http.Server = http.createServer(app);
server.on("error", onError); // Error handler
server.on("listening", onListening); // Notify that we started
createTerminus(server, {
  healthChecks: {
    "/healthcheck": healthCheck,
  },
  onSignal: onSignal,
  onShutdown: onShutdown,
});
server.listen(port); // Start the server

/**
 * Function to handle signals to shut down, handles any cleanup
 */
function onSignal(): Promise<void> {
  // On shutdown request
  console.info(`Server shutting down...`);

  // Return a successful promise, so that we can return one here without using anything async
  return Promise.resolve();
}

/**
 * Function to handle any last tasks after cleanup
 */
function onShutdown(): Promise<void> {
  console.log("Shut down complete");

  // Return a successful promise, so that we can return one here without using anything async
  return Promise.resolve();
}

/**
 * Function to handle healthcheck requests, ensures that Prisma is working
 * correctly
 */
async function healthCheck() {
  // Simply validate the DB connection works
  await prisma.$executeRaw`select 1`;
}

/**
 * Event listener for HTTP server "error" event, to provide user friendly error output and then exit
 */
function onError(error: NodeJS.ErrnoException): void {
  // If we're doing something other than try to listen, we can't help
  if (error.syscall !== "listen") {
    throw error; // Re-throw
  }

  // Get the pipe/port we're listening on
  const bind: string = "Port " + port;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    // Server can't get start permission
    case "EACCES":
      console.error(`Failed to start: ${bind} requires elevated permissions!`);
      process.exit(1);
      break;
    // Server can't get address
    case "EADDRINUSE":
      console.error(`Failed to start: ${bind} + ' is already in use`);
      process.exit(1); // Exit with failure
      break;
    default:
      // Print the default error otherwise, and exit
      console.error(`Failed to start: Unknown binding error:
    ${error.name}`);
      process.exit(1);
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening(): void {
  // Get the address we're listening to on
  const addr: string | AddressInfo | null = server.address();

  // If it's a string, get it (it's a pipe)
  const bind: string =
    typeof addr === "string" ? "pipe " + addr : "port " + addr?.port; // Otherwise get the port
  console.info("Server listening on " + bind); // Debug output that we're listening
  console.log("Startup complete");
}
