import { z } from "zod";

/**
 * Schema for the predicted (required) system environment. Not strict because
 * extra stuff should be allowed (since there's a ton of random shit in env)
 */
const env = z.object({
  NK_CLIENT_ID: z.string(), // The client ID for NK
  NK_CLIENT_SECRET: z.string(), // The client secret for NKJ
  NK_REDIRECT_URI: z.string(), // The redirect URL for NK
  DATABASE_URL: z.string(), // The DB URL
  NODE_ENV: z.enum(["development", "production", "test"]), // Allowed node env types
});

export default env;
