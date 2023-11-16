import {
  GetNkAccountsByIdResponse,
  GetNkAccountsResponse,
  IErrorResponse,
  PatchNkAccountsByIdRequest,
  PatchNkAccountsByIdResponse,
  PostNkAccountsRequest,
  PostNkAccountsResponse,
} from "api-schema";
import { NkCredential, prisma } from "database";
import express, { Request, Response, Router } from "express";
import { z } from "zod";
import { validateHasId } from "../middleware/validateHasId.js";
import { ITokenResponse, handleCodeExchange } from "../nk/oauth.js";
import nkAccountsDataRouter from "./nk-accounts-data.ts";

// Router that acts as an entry point to all NK data.
// This includes pathing
// to data, but this file contains only account management information
const router: Router = express.Router();

router
  .route("/:id")
  .get(
    validateHasId("id"),
    // Again, using express 4 with express 5 types. Gets a single NK account by ID
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async function (req: Request, res: Response): Promise<void> {
      // Now get the account at that ID
      const account = await prisma.nkCredential.findUnique({
        where: {
          userId: parseInt(req.params.id),
        },
      });

      // Validate the account exists
      if (account == null) {
        res.status(404).send({
          message: "Invalid account ID (account ID does not exist)",
        } satisfies IErrorResponse);
        return;
      }

      // Now that we've validated everything, send all the data
      res.status(200).send({
        firstName: account.firstName,
        lastName: account.lastName,
        userId: account.userId,
        ownTeamId: account.ownTeamId,
      } satisfies z.infer<typeof GetNkAccountsByIdResponse>);
    },
  )
  // Deletes a single NK account by ID
  .delete(
    validateHasId("id"),
    // Again, using express 4 with express 5 types
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async function (req: Request, res: Response): Promise<void> {
      // Now delete the account at that ID. Easy enough to do it this way so we don't throw or anything if it fails
      const deletedInfo = await prisma.nkCredential.deleteMany({
        where: {
          userId: parseInt(req.params.id),
        },
      });

      if (deletedInfo.count == 0) {
        // If the account didn't exist (no updated rows) send error
        res.status(404).send({
          message: "Invalid account ID (account ID does not exist)",
        } satisfies IErrorResponse);
        return;
      } else {
        // Otherwise, send OK
        res.sendStatus(200);
      }
    },
  );

// Updates a single NK account by ID
router.patch(
  "/:id",
  validateHasId("id"),
  // Again, using express 4 with express 5 types
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    let request: z.infer<typeof PatchNkAccountsByIdRequest>; // Request
    try {
      // Validate the input
      request = PatchNkAccountsByIdRequest.parse(req.body);
    } catch (error) {
      res
        .status(400)
        .send({ message: "Invalid request body" } satisfies IErrorResponse);
      return;
    }

    let updatedUser: NkCredential;
    // Now update the account at that ID
    try {
      updatedUser = await prisma.nkCredential.update({
        where: {
          userId: parseInt(req.params.id),
        },
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
        },
      });
    } catch (error) {
      // If the account didn't exist (no updated rows) send error
      res.status(404).send({
        message: "Invalid account ID (account ID does not exist)",
      } satisfies IErrorResponse);
      return;
    }

    // Otherwise, send OK and the actual user back
    res.status(200).send({
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      userId: updatedUser.userId,
      ownTeamId: updatedUser.ownTeamId,
    } satisfies z.infer<typeof PatchNkAccountsByIdResponse>);
  },
);

router
  .route("/")

  // Again, using express 4 with express 5 types =(
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .get(async function (_: Request, res: Response): Promise<void> {
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
        } satisfies z.infer<typeof GetNkAccountsByIdResponse>;
      }),
    } satisfies z.infer<typeof GetNkAccountsResponse>);
  })
  // Endpoint to add an account
  .post(
    // Since we're using Express 4 types with Express 5 this happens :(
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async function (req: Request, res: Response): Promise<void> {
      let request: z.infer<typeof PostNkAccountsRequest>; // Request
      try {
        // Validate the input
        request = PostNkAccountsRequest.parse(req.body);
      } catch (error) {
        res
          .status(400)
          .send({ message: "Invalid request body" } satisfies IErrorResponse);
        return;
      }

      let result: ITokenResponse;

      // Now make the authorization request, putting hte code and grant in the URL, and the auth in the header
      try {
        result = await handleCodeExchange(request.code);
      } catch (error) {
        res.status(400).send({
          message: "Invalid authorization code",
        } satisfies IErrorResponse);
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
          .send({ message: "User already exists" } satisfies IErrorResponse);
        return;
      }

      // Await creating the credential, calculate the expirey
      const createdAccount = await prisma.nkCredential.create({
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
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
      } satisfies z.infer<typeof PostNkAccountsResponse>);
    },
  );

// Pass through to the data router if there is data here
router.use("/", nkAccountsDataRouter);

export default router;
