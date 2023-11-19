import { z } from "zod";

/**
 * Generic error response, with a human-readable message
 */
export const genericError = z.strictObject({
  /**
   * @type {string} - human-readable message describing the error
   */
  message: z.string(),
});

/**
 * Error response for a 404 (e.g., something couldn't be found)
 */
export const notFoundError = z.strictObject({
  /**
   * @type {string} - the name of the parameter that does not exist
   */
  key: z.string(),
});
