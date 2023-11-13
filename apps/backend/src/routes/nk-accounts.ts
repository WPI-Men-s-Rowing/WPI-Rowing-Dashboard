import axios, { AxiosResponse } from "axios";
import { PostAuthCodes } from "common";
import { prisma } from "database";
import express, { Request, Response, Router } from "express";

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

router.post(
  "/auth-codes",
  // Since we're using Express 4 types with Express 5 this happens :(
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    let request: { code: string }; // Request

    try {
      // Validate the input
      request = PostAuthCodes.parse(req.body);
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
    await prisma.nkCredential.create({
      data: {
        userId: result.data.user_id,
        ownTeamId: result.data.own_team_id,
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        tokenExpiry: new Date(Date.now() + result.data.expires_in * 1000),
      },
    });

    // If all went, well acknowledge that
    res.sendStatus(200);
  },
);

export default router;
