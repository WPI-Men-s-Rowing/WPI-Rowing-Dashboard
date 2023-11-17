import {
  nkAccounts
} from "api-schema";

import { NkCredential, prisma } from "database";
import { Router } from "express";
import { ITokenResponse, handleCodeExchange } from "../nk/oauth.js";
import nkAccountsDataRouter from "./nk-accounts-data.ts";
import asyncify from "express-asyncify";
import { zodiosRouter } from "@zodios/express";

// Router that acts as an entry point to all NK data.
// This includes pathing
// to data, but this file contains only account management information
const router = zodiosRouter(nkAccounts, {
  router: asyncify(Router())
});

router
  .get("/:id",
    // Safe because of asyncify
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async function (req, res): Promise<void> {
      // Now get the account at that ID
      const account = await prisma.nkCredential.findUnique({
        where: {
          userId: req.params.id,
        },
      });

      // Validate the account exists
      if (account == null) {
        res.status(404).send({
          message: "Invalid account ID (account ID does not exist)",
        });
        return;
      }

      // Now that we've validated everything, send all the data
      res.status(200).send({
        firstName: account.firstName,
        lastName: account.lastName,
        userId: account.userId,
        ownTeamId: account.ownTeamId,
      });
    },
  );
  // Deletes a single NK account by ID
  router.delete("/:id",
    // Safe because of asyncify
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async function (req, res): Promise<void> {
      // Now delete the account at that ID. Easy enough to do it this way, so we don't throw or anything if it fails
      const deletedInfo = await prisma.nkCredential.deleteMany({
        where: {
          userId: req.params.id,
        },
      });

      if (deletedInfo.count == 0) {
        // If the account didn't exist (no updated rows) send error
        res.status(404).send({
          message: "Invalid account ID (account ID does not exist)",
        });
        return;
      } else {
        // Otherwise, send OK
        res.status(200).send(null);
      }
    },
  );

// Updates a single NK account by ID
router.patch(
  "/:id",
  // Safe because we're using asyncify
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req, res): Promise<void> {
    let updatedUser: NkCredential;
    // Now update the account at that ID
    try {
      updatedUser = await prisma.nkCredential.update({
        where: {
          userId: req.params.id,
        },
        data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        },
      });
    } catch (error) {
      // If the account didn't exist (no updated rows) send error
      res.status(404).send({
        message: "Invalid account ID (account ID does not exist)",
      });
      return;
    }

    // Otherwise, send OK and the actual user back
    res.status(200).send({
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      userId: updatedUser.userId,
      ownTeamId: updatedUser.ownTeamId,
    });
  },
);

router
  .get("/",
     // We're allowed to do this because of asyncify
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async function (_, res): Promise<void> {
    // Get all NK Accounts
    const accounts = await prisma.nkCredential.findMany();

    // Now map the accounts into the expected types and return the account data
    res.status(200).send({
      accounts: accounts.map((account) => {
        return {
          firstName: account.firstName,
          lastName: account.lastName,
          userId: account.userId,
          ownTeamId: account.ownTeamId,
        };
      }),
    });
  });

router
  .post("/",
    // Since we're using Express 4 types with Express 5 this happens :(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async function (req, res): Promise<void> {

      let result: ITokenResponse;

      // Now make the authorization request, putting hte code and grant in the URL, and the auth in the header
      try {
        result = await handleCodeExchange(req.body.code);
      } catch (error) {
        res.status(400).send({
          message: "Invalid authorization code",
        });
        return;
      }

      // Test to see if the user already exists
      const alreadyExistingUser = await prisma.nkCredential.findUnique({
        where: {
          userId: result.user_id,
        },
      });

      // Validate that we haven't already seen this user
      if (alreadyExistingUser) {
        res
          .status(409)
          .send({ message: "User already exists" });
        return;
      }

      // Await creating the credential, calculate the expiry
      const createdAccount = await prisma.nkCredential.create({
        data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          userId: result.user_id,
          ownTeamId: result.own_team_id,
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          tokenExpiry: new Date(Date.now() + result.expires_in * 1000),
        },
      });

      // If all went, well acknowledge that
      res.status(200).send({
        firstName: createdAccount.firstName,
        lastName: createdAccount.lastName,
        userId: createdAccount.userId,
        ownTeamId: createdAccount.ownTeamId,
      });
    },
  );

// Pass through to the data router if there is data here
router.use(nkAccountsDataRouter);

// This is the only way to make typescript happy and let this export :)
export default router as unknown as Router;
