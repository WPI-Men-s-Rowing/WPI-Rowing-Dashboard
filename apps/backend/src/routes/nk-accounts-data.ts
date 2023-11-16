import { prisma } from "database";
import express, { Request, Response, Router } from "express";
import { IRequestWithId, validateHasId } from "../middleware/validateHasId.js";
import { handleTokenRefresh } from "../nk/oauth.js";

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

  console.info("Checking access token expiry on user " + userId);

  // If the token has expired
  if (Date.now() > user.tokenExpiry.getTime()) {
    console.info("Token expired on user " + userId);
    console.log("Refreshing token for user " + userId);

    // Perform the refresh
    const result = await handleTokenRefresh(user.refreshToken);

    console.log("Refresh token exchange complete for user " + userId);
    console.info("Writing new token to database for user" + userId);

    // Update the user in the database
    const newUser = await prisma.nkCredential.update({
      where: {
        userId: user.userId,
      },
      data: {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        tokenExpiry: new Date(Date.now() + result.expires_in * 1000),
      },
    });

    console.info("Successfully wrote new token to database for user " + userId);

    // Now return the access token
    return newUser.accessToken;
  } else {
    // Otherwise, the token is good, so return it
    return user.accessToken;
  }
}

// Router for NK account data. Assumes to be mounted somewhere that has :id as a path parameter
const router: Router = express.Router();

// Handler to get all sessions associated with this account
router.get(
  "/:accountId/data/sessions",
  validateHasId("accountId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    await getAccessToken((req as IRequestWithId)._id);
    res.send(200);
  },
);

export default router;
