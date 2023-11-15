import { z } from "zod";

/**
 * Type to be used to add a new NK account (request)
 */
export const PostNkAccountsRequest = z
  .object({
    firstName: z.string(), // First name on the account
    lastName: z.string(), // Last name on the account
    code: z.string(), // Code to get the account with
  })
  .strict();

/**
 * Type to be returned by a successful post nk response request.
 * This extends the get nk account by ID response
 * (as this is what that is)
 */
export type IPostNkAccountsResponse = IGetNkAccountsByIdResponse;

/**
 * Type to be used to update an NK account (request). Does not contain ID,
 * as that is a path parameter and cannot be changed
 */
export const PatchNkAccountsByIdRequest = z
  .object({
    firstName: z.string(), // New first name for the account
    lastName: z.string(), // New last name for the account
  })
  .strict();

/**
 * Type to be returned by a successful patch NK accounts request.
 * This extends the get nk
 */
export type IPatchNkAccountsByIdResponse = IGetNkAccountsByIdResponse;

/**
 * The returned type of getting an individual NK Account by ID
 */
export interface IGetNkAccountsByIdResponse {
  firstName: string;
  lastName: string;
  userId: number;
  ownTeamId: number;
}

/**
 * The returned type of getting all NK Accounts
 */
export interface IGetNkAccountsResponse {
  accounts: IGetNkAccountsByIdResponse[];
}

export * from "./nk-accounts-data.ts";
