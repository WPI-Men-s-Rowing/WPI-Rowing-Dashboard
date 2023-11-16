import { z } from "zod";

/**
 * Type to be used to add a new NK account (request)
 */
export const PostNkAccountsRequest = z
  .strictObject({
    firstName: z.string(), // First name on the account
    lastName: z.string(), // Last name on the account
    code: z.string(), // Code to get the account with
  })
  .strict();

/**
 * Type to be used to update an NK account (request). Does not contain ID,
 * as that is a path parameter and cannot be changed
 */
export const PatchNkAccountsByIdRequest = z
  .strictObject({
    firstName: z.string(), // New first name for the account
    lastName: z.string(), // New last name for the account
  })
  .strict();

/**
 * The returned type of getting an individual NK Account by ID
 */
export const GetNkAccountsByIdResponse = z
  .strictObject({
    firstName: z.string(),
    lastName: z.string(),
    userId: z.coerce.number(),
    ownTeamId: z.coerce.number(),
  })
  .strict();

/**
 * Type to be returned by a successful patch NK accounts request.
 * This extends the get nk
 */
export const PatchNkAccountsByIdResponse = GetNkAccountsByIdResponse;

/**
 * The returned type of getting all NK Accounts
 */
export const GetNkAccountsResponse = z
  .strictObject({
    accounts: z.array(GetNkAccountsByIdResponse),
  })
  .strict();

/**
 * Type to be returned by a successful post nk response request.
 * This extends the get nk account by ID response
 * (as this is what that is)
 */
export const PostNkAccountsResponse = GetNkAccountsByIdResponse;

export * from "./nk-accounts-data.ts";
