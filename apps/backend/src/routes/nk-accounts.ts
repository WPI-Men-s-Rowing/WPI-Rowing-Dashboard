import axios, { AxiosResponse } from "axios";
import {
  GetNkAccountsByIdResponse,
  GetNkAccountsResponse,
  PatchNkAccountsByIdRequest,
  PatchNkAccountsByIdResponse,
  PostNkAccountsRequest,
  PostNkAccountsResponse,
} from "common";
import { NkCredential, prisma } from "database";
import express, { Request, Response, Router } from "express";
import { z } from "zod";

const router: Router = express.Router();

/**
 * Interface that describes what should be sent in the body to the Token OAuth
 * endpoint
 */
interface ITokenRequest {
  code: string; // OAuth code
  grant_type: "authorization_code"; // Required, since we're using auth code grant
  redirect_uri: string; // Redirect URI, required
  code_challenge?: string; // Optional code challenge if the code was generated with PKCE
}

/**
 * Interface that describes what should be sent inthe response to the Token OAuth endpoint
 */
interface ITokenResponse {
  access_token: string; // Access token
  refresh_token: string; // Refresh token
  token_type: string; // Token type (bearer)
  scope: string; // Scopes the token has
  user_id: number; // UserID of the user the token is for
  own_team_id: number; // TeamID of the user the token is for
  jti: string; // JSON Token ID (useless?)
  expires_in: number; // Time (in seconds) until token expiry
}

// Again, using express 4 with express 5 types =(
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get("/", async function (_: Request, res: Response): Promise<void> {
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
      } satisfies GetNkAccountsByIdResponse;
    }),
  } satisfies GetNkAccountsResponse);
});

// Again, using express 4 with express 5 types. Gets a single NK account by ID
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get("/:id", async function (req: Request, res: Response): Promise<void> {
  // Validate the ID is there
  if (req.params.id == undefined) {
    res.status(400).send("Missing required parameter ID");
    return;
  }

  // Now parse the ID to ensure it is a number
  let parsedId: number;
  try {
    parsedId = parseInt(req.params.id);
  } catch (error) {
    res.status(400).send("Invalid account ID (account IDs must be integers!)");
    return;
  }

  // Now get the account at that ID
  const account = await prisma.nkCredential.findUnique({
    where: {
      userId: parsedId,
    },
  });

  // Validate the account exists
  if (account == null) {
    res.status(400).send("Invalid account ID (account ID does not exist!");
    return;
  }

  // Now that we've validated everything, send all the data
  res.status(200).send({
    firstName: account.firstName,
    lastName: account.lastName,
    userId: account.userId,
    ownTeamId: account.ownTeamId,
  } satisfies GetNkAccountsByIdResponse);
});

// Deletes a single NK account by ID
router.delete(
  "/:id",
  // Again, using express 4 with express 5 types
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Validate the ID is there
    if (req.params.id == undefined) {
      res.status(400).send("Missing required parameter ID");
      return;
    }

    // Now parse the ID to ensure it is a number
    let parsedId: number;
    try {
      parsedId = parseInt(req.params.id);
    } catch (error) {
      res
        .status(400)
        .send("Invalid account ID (account IDs must be integers!)");
      return;
    }

    // Now delete the account at that ID. Easy enough to do it this way so we don't throw or anything if it fails
    const deletedInfo = await prisma.nkCredential.deleteMany({
      where: {
        userId: parsedId,
      },
    });

    if (deletedInfo.count == 0) {
      // If the account didn't exist (no updated rows) send error
      res.status(409).send("Invalid account ID (account ID does not exist!");
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
  // Again, using express 4 with express 5 types
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Validate the ID is there
    if (req.params.id == undefined) {
      res.status(400).send("Missing required parameter ID");
      return;
    }

    // Now parse the ID to ensure it is a number
    let parsedId: number;
    try {
      parsedId = parseInt(req.params.id);
    } catch (error) {
      res
        .status(400)
        .send("Invalid account ID (account IDs must be integers!)");
      return;
    }

    let request: z.infer<typeof PatchNkAccountsByIdRequest>; // Request
    try {
      // Validate the input
      request = PatchNkAccountsByIdRequest.parse(req.body);
    } catch (error) {
      res.status(400).send("Invalid request body");
      return;
    }

    let updatedUser: NkCredential;
    // Now update the account at that ID
    try {
      updatedUser = await prisma.nkCredential.update({
        where: {
          userId: parsedId,
        },
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
        },
      });
    } catch (error) {
      // If the account didn't exist (no updated rows) send error
      res.status(409).send("Invalid account ID (account ID does not exist!");
      return;
    }

    // Otherwise, send OK and the actual user back
    res.status(200).send({
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      userId: updatedUser.userId,
      ownTeamId: updatedUser.ownTeamId,
    } satisfies PatchNkAccountsByIdResponse);
  },
);

// Endpoint to add an account
router.post(
  "/",
  // Since we're using Express 4 types with Express 5 this happens :(
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    let request: z.infer<typeof PostNkAccountsRequest>; // Request
    try {
      // Validate the input
      request = PostNkAccountsRequest.parse(req.body);
    } catch (error) {
      res.status(400).send("Invalid request body");
      return;
    }

    let result: AxiosResponse<ITokenResponse, AxiosResponse<ITokenRequest>>;

    // Now make the authorization request, putting hte code and grant in the URL, and the auth in the header
    try {
      result = await axios.post(
        "https://oauth-logbook.nksports.com/oauth/token",
        {
          code: request.code,
          grant_type: "authorization_code",
          redirect_uri: process.env.NK_REDIRECT_URI!,
        } satisfies ITokenRequest,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${process.env.NK_CLIENT_ID}:${process.env.NK_CLIENT_SECRET}`,
            ).toString("base64")}`,
          },
        },
      );
    } catch (error) {
      res.status(400).send("Invalid authorization code");
      return;
    }

    // Test to see if the user already exists
    const alreadyExistingUser = await prisma.nkCredential.findUnique({
      where: {
        userId: result.data.user_id,
      },
    });

    // Validate that we haven't already seen this user
    if (alreadyExistingUser) {
      res.status(409).send("User already exists!");
      return;
    }

    // Await creating the credential, calculate the expirey
    const createdAccount = await prisma.nkCredential.create({
      data: {
        firstName: request.firstName,
        lastName: request.lastName,
        userId: result.data.user_id,
        ownTeamId: result.data.own_team_id,
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        tokenExpiry: new Date(Date.now() + result.data.expires_in * 1000),
      },
    });

    // If all went, well acknowledge that
    res.status(200).send({
      firstName: createdAccount.firstName,
      lastName: createdAccount.lastName,
      userId: createdAccount.userId,
      ownTeamId: createdAccount.ownTeamId,
    } satisfies PostNkAccountsResponse);
  },
);

export default router;
