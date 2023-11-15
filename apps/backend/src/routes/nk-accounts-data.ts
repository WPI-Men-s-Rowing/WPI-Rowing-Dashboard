import axios, { AxiosResponse } from "axios";
import { prisma } from "database";
import express, { Request, Response, Router } from "express";
import { URLSearchParams } from "url";

/**
 * Interface that describes what should be in a token refresh request
 */
interface ITokenRefreshRequest {
  refresh_token: string; // The token to use in the refresh request
  grant_type: "refresh_token"; // Required since we're doing refresh
}

/**
 * Interface describing what should be in a token refresh response
 */
interface ITokenRefreshResponse {
  access_token: string; // Access token
  refresh_token: string; // Refresh token
  token_type: string; // Token type (bearer)
  scope: string; // Scopes the token has
  user_id: number; // UserID of the user the token is for
  own_team_id: number; // TeamID of the user the token is for
  jti: string; // JSON Token ID (useless?)
  expires_in: number; // Time (in seconds) until token expiry
}

/**
 * Gets tha access token for a given user ID, refreshing using the refresh token
 * if necessary
 * @param userId the user ID to get a token from
 */
async function getAccessToken(userId: number): Promise<string> {
  // Get the user the token is associated with
  const user = await prisma.nkCredential.findUniqueOrThrow({
    where: {
      userId: userId,
    },
  });

  // If the token has expired
  if (Date.now() > user.tokenExpiry.getTime()) {
    // Perform the refresh
    const result = await axios.post<
      ITokenRefreshRequest,
      AxiosResponse<ITokenRefreshResponse>
    >(
      "https://oauth-logbook.nksports.com/oauth/token",
      {
        refresh_token: user.refreshToken,
        grant_type: "refresh_token",
      } satisfies ITokenRefreshRequest,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.NK_CLIENT_ID}:${process.env.NK_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
      },
    );

    // Update the user in the database
    const newUser = await prisma.nkCredential.update({
      where: {
        userId: user.userId,
      },
      data: {
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token,
        tokenExpiry: new Date(Date.now() + result.data.expires_in * 1000),
      },
    });

    // Now return the access token
    return newUser.accessToken;
  } else {
    // Otherwise, the token is good, so just return it
    return user.accessToken;
  }
}

// Router for NK account data. Assumes to be mounted somewhere that has :id as a path parameter
const router: Router = express.Router();

// Handler to get all sessions associated with this account
router.get(
  "/:accountId/data/sessions",
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.accountId);

    const sessions = await axios.get<Record<string, unknown>[]>(
      "https://logbook-api.nksports.com/api/v1/sessions",
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken(id)}`,
        },
      },
    );

    const allIds = sessions.data.map((session) => session.id);

    const allData = await axios.get(
      "https://logbook-api.nksports.com/api/v1/sessions/strokes?" +
        new URLSearchParams({
          sessionIds: allIds.join(","),
        }).toString(),
      {
        headers: {
          Authorization: `Bearer ${await getAccessToken(id)}`,
        },
      },
    );

    res.send(allData);
  },
);

export default router;
