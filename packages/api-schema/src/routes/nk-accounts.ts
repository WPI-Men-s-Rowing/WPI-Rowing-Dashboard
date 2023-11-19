import { genericError, notFoundError } from "#components";
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import nkAccountsData from "./nk-accounts-data.js";

/**
 * An NK Account schema type, with information that would be returned
 * by a request for an NK Account
 */
const nKAccount = z.strictObject({
  /**
   * @type {string} - the first name assigned to the account
   */
  firstName: z.string(),
  /**
   * @type {string} - the last name assigned to the account
   */
  lastName: z.string(),
  /**
   * @type {number} - the user's ID (assigned by NK)
   */
  userId: z.number(),
  /**
   * @type {number} - the user's team ID (assigned by NK)
   */
  ownTeamId: z.number(),
});

// Create a contract
const contract = initContract();

// Create a router from the contract, and export it
export default contract.router(
  {
    postNkAccount: {
      method: "POST",
      path: "/",
      responses: {
        200: nKAccount,
        400: genericError,
        409: genericError,
      },
      description: "Create a new NK account",
      body: z.strictObject({
        /**
         * @type {string} - first name to assign to the account
         */
        firstName: z.string(),
        /**
         * @type {string} - last name to assign to the account
         */
        lastName: z.string(),
        /**
         * @type {string} - the code to get the account credentials with
         */
        code: z.string(),
      }),
    },
    getNkAccount: {
      method: "GET",
      path: "/:id",
      pathParams: z.strictObject({
        /**
         * @type {number} - the unique account ID of the user
         */
        id: z.number(),
      }),
      responses: {
        200: nKAccount,
        404: notFoundError,
      },
      description: "Get an NK account by its ID",
    },
    getAllNkAccounts: {
      method: "GET",
      path: "/",
      responses: {
        200: z.strictObject({
          accounts: z.array(nKAccount),
        }),
      },
      description: "Get all NK accounts",
    },
    deleteNKAccount: {
      method: "DELETE",
      path: "/:id",
      description: "Delete an NK account by its ID",
      body: z.undefined(),
      pathParams: z.strictObject({
        /**
         * @type {number} - the ID of the account to delete
         */
        id: z.number(),
      }),
      responses: {
        200: z.undefined(),
        404: notFoundError,
      },
    },
    patchNKAccount: {
      method: "PATCH",
      path: "/:id",
      description: "Update an NK account by its ID",
      pathParams: z.strictObject({
        /**
         * @type {number} - the ID of the NK account to delete
         */
        id: z.number(),
      }),
      body: z.strictObject({
        /**
         * @type {string} - the first name to set on the account
         */
        firstName: z.string(),
        /**
         * @type {string} - the last name to set on the account
         */
        lastName: z.string(),
      }),
      responses: {
        200: nKAccount,
        404: notFoundError,
      },
    },
    data: nkAccountsData,
  },
  {},
);
