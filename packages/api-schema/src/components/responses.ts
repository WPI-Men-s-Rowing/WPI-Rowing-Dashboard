import { z } from "zod";

/**
 * Generic error response, with a human-readable message
 */
export const genericError = z.strictObject({
  message: z.string().describe("Human-readable message describing the error"),
});

/**
 * Error response for a 404 (e.g., something couldn't be found)
 */
export const notFoundError = z.strictObject({
  key: z.string().describe("The name of the parameter that does not exist"),
});
