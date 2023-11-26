import { PrismaClient } from "@prisma/client";
import axios, { AxiosResponse } from "axios";
import * as process from "process";
import puppeteer from "puppeteer";
import { URLSearchParams } from "url";

const prisma = new PrismaClient();

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

/**
 * Database seed function, reads the NK_AUTH_TOKEN from the env file and
 * puts it in the DB
 */
async function main() {
  // I have literally no better idea other than to use this, so that's what we're doing!
  // This is just a headless browser we will authenticate with...
  const browser = await puppeteer.launch({ headless: "new" });
  const loginPage = await browser.newPage();

  // Navigate to the login page
  await loginPage.goto(
    "https://oauth-logbook.nksports.com/oauth/authorize?" +
      new URLSearchParams({
        response_type: "code",
        // Look in the env file for the client id
        client_id: process.env.NK_CLIENT_ID!,
        redirect_uri: process.env.NK_REDIRECT_URI!,
        scope: "read",
      }).toString(),
  );

  // Finished auth code
  let authCode = "";

  // Intercept requests (so we can catch when we go to the auth URL)
  await loginPage.setRequestInterception(true);
  loginPage.on("request", (request) => {
    const url = new URL(request.url());

    // If the URL isn't the NK redirect URI
    if (url.origin + url.pathname != process.env.NK_REDIRECT_URI) {
      // Allow the request to continue
      void request.continue();
    } else {
      void request.abort(); // Otherwise, abort the request (so we keep the code)
      authCode = url.searchParams.get("code")!; // Get the auth code
    }
  });

  // Await filling in with the email and password
  await loginPage.locator("#email").fill(process.env.NK_AUTH_EMAIL!);
  await loginPage.locator("#password").fill(process.env.NK_AUTH_PASSWORD!);
  await loginPage.locator("#sign-in-button").click();

  // Wait for the navigation
  await loginPage.waitForNavigation();

  // Click the allow request
  await loginPage.locator("#accept-btn").click();

  // Wait for the request to finish. At this point, we should have
  // the code saved
  await loginPage.waitForNavigation();

  // Clean everything up
  await loginPage.close();
  await browser.close();

  await handleCodeAvailable(authCode);
}

/**
 * Function to handle an auth code being available
 * @param code the code to use in authentication
 */
async function handleCodeAvailable(code: string): Promise<void> {
  const tokenResponse = await axios.post<
    ITokenRequest,
    AxiosResponse<ITokenResponse>
  >(
    "https://oauth-logbook.nksports.com/oauth/token",
    {
      code: code,
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

  // Write the token
  const token = await prisma.nkCredential.upsert({
    where: {
      userId: tokenResponse.data.user_id,
    },
    create: {
      firstName: process.env.NK_AUTH_FIRST_NAME!,
      lastName: process.env.NK_AUTH_LAST_NAME!,
      userId: tokenResponse.data.user_id,
      ownTeamId: tokenResponse.data.own_team_id,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.data.expires_in * 1000),
    },
    update: {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.data.expires_in * 1000),
    },
  });

  console.log({ token }); // Write that we added the token
}

// Run the seed, then disconnect. If something goes wrong, output an error
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
