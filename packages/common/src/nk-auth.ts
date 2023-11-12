import { z } from "zod";

// Type that will be used when auth codes are added
export const addAuthCodeRequest = z
  .object({
    code: z.string(),
  })
  .strict();
