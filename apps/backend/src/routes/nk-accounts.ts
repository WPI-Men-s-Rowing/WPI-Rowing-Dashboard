import contract from "api-schema";

import { initServer } from "@ts-rest/fastify";
import { NkCredential } from "database";
import fastify from "../app.ts";
import { ITokenResponse, handleCodeExchange } from "../nk/oauth.js";
import nkAccountsDataRouter from "./nk-accounts-data.ts";

// Create a server to use for the NK accounts
const server = initServer();

export default server.router(contract.nkAccounts, {
  getNkAccount: async ({ params }) => {
    // Now get the account at that ID
    const account = await fastify.prisma.nkCredential.findUnique({
      where: {
        userId: params.id,
      },
    });

    // Validate the account exists
    if (account == null) {
      return {
        status: 404,
        body: {
          key: "id",
        },
      };
    }

    // Now that we've validated everything, send all the data
    return {
      status: 200,
      body: {
        firstName: account.firstName,
        lastName: account.lastName,
        userId: account.userId,
        ownTeamId: account.ownTeamId,
      },
    };
  },
  deleteNKAccount: async ({ params }) => {
    // Now delete the account at that ID. Easy enough to do it this way, so we don't throw or anything if it fails
    const deletedInfo = await fastify.prisma.nkCredential.deleteMany({
      where: {
        userId: params.id,
      },
    });

    if (deletedInfo.count == 0) {
      // If the account didn't exist (no updated rows) send error
      return {
        status: 404,
        body: {
          key: "id",
        },
      };
    } else {
      // Otherwise, send OK
      return {
        status: 204,
        body: {},
      };
    }
  },
  patchNKAccount: async ({ params, body }) => {
    let updatedUser: NkCredential;
    // Now update the account at that ID
    try {
      updatedUser = await fastify.prisma.nkCredential.update({
        where: {
          userId: params.id,
        },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
        },
      });
    } catch (error) {
      // If the account didn't exist (no updated rows) send error
      return {
        status: 404,
        body: {
          key: "id",
        },
      };
    }

    // Otherwise, send OK and the actual user back
    return {
      status: 200,
      body: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        userId: updatedUser.userId,
        ownTeamId: updatedUser.ownTeamId,
      },
    };
  },
  getAllNkAccounts: async () => {
    // Get all NK Accounts
    const accounts = await fastify.prisma.nkCredential.findMany();

    // Now map the accounts into the expected types and return the account data
    return {
      status: 200,
      body: {
        accounts: accounts.map((account) => {
          return {
            firstName: account.firstName,
            lastName: account.lastName,
            userId: account.userId,
            ownTeamId: account.ownTeamId,
          };
        }),
      },
    };
  },
  postNkAccount: async ({ body }) => {
    let result: ITokenResponse;

    // Now make the authorization request, putting hte code and grant in the URL, and the auth in the header
    try {
      result = await handleCodeExchange(body.code);
    } catch (error) {
      return {
        status: 400,
        body: {
          message: "Invalid authorization code",
        },
      };
    }

    // Test to see if the user already exists
    const alreadyExistingUser = await fastify.prisma.nkCredential.findUnique({
      where: {
        userId: result.user_id,
      },
    });

    // Validate that we haven't already seen this user
    if (alreadyExistingUser) {
      return { status: 409, body: { message: "User already exists" } };
    }

    // Await creating the credential, calculate the expiry
    const createdAccount = await fastify.prisma.nkCredential.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        userId: result.user_id,
        ownTeamId: result.own_team_id,
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        tokenExpiry: new Date(Date.now() + result.expires_in * 1000),
      },
    });

    // If all went, well acknowledge that
    return {
      status: 200,
      body: {
        firstName: createdAccount.firstName,
        lastName: createdAccount.lastName,
        userId: createdAccount.userId,
        ownTeamId: createdAccount.ownTeamId,
      },
    };
  },
  data: nkAccountsDataRouter,
});
