import { genericError, nKAccount, notFoundError } from "#components";
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import nkAccountsData from "./nk-accounts-data.ts";

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
        firstName: z.string().describe("First name to assign to the account"),
        lastName: z.string().describe("Last name to assign to the account"),
        code: z
          .string()
          .describe("The code to get the account credentials with"),
      }),
    },
    getNkAccount: {
      method: "GET",
      path: "/:id",
      pathParams: z.strictObject({
        id: z.coerce.number().describe("The unique account ID of the user"),
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
      body: z.strictObject({}).describe("Accepts no body"),
      pathParams: z.strictObject({
        id: z.coerce.number().describe("The ID of the account to delete"),
      }),
      responses: {
        204: z.strictObject({}).describe("Returns an empty object"),
        404: notFoundError,
      },
    },
    patchNKAccount: {
      method: "PATCH",
      path: "/:id",
      description: "Update an NK account by its ID",
      pathParams: z.strictObject({
        id: z.coerce.number().describe("The ID of the NK account to delete"),
      }),
      body: z.strictObject({
        firstName: z.string().describe("The first name to set on the account"),
        lastName: z.string().describe("The last name to set on the account"),
      }),
      responses: {
        200: nKAccount,
        404: notFoundError,
      },
    },
    data: nkAccountsData,
  },
  {
    pathPrefix: "/nk-accounts",
  },
);
