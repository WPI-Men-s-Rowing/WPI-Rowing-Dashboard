import axios, { AxiosResponse } from "axios";

// Base URL for auth
const OAUTH_URL_BASE = "https://oauth-logbook.nksports.com/oauth";

/**
 * Interface that describes what should be sent in the body to the Token OAuth
 * endpoint
 */
export interface ITokenRequest {
  code: string; // OAuth code
  grant_type: "authorization_code"; // Required, since we're using auth code grant
  redirect_uri: string; // Redirect URI, required
  code_challenge?: string; // Optional code challenge if the code was generated with PKCE
}

/**
 * Interface that describes what should be sent inthe response to the Token OAuth endpoint
 */
export interface ITokenResponse {
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
 * Interface that describes what should be in a token refresh request
 */
export interface ITokenRefreshRequest {
  refresh_token: string; // The token to use in the refresh request
  grant_type: "refresh_token"; // Required since we're doing refresh
}

/**
 * Interface describing what should be in a token refresh response
 */
export interface ITokenRefreshResponse {
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
 * Method to handle a code exchange for an access token
 * @param code the code to exchange for an access token
 * @returns the data returned by the code -> token exchange
 */
export async function handleCodeExchange(
  code: string,
): Promise<ITokenResponse> {
  return (
    await axios.post<ITokenRequest, AxiosResponse<ITokenResponse>>(
      "/token",
      {
        code: code,
        grant_type: "authorization_code",
        redirect_uri: process.env.NK_REDIRECT_URI,
      } satisfies ITokenRequest,
      {
        baseURL: OAUTH_URL_BASE,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.NK_CLIENT_ID}:${process.env.NK_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
      },
    )
  ).data;
}

/**
 * Method to handle a token refresh
 * @param refreshToken the refresh token to use
 * @returns the data returned by the token exchange
 */
export async function handleTokenRefresh(
  refreshToken: string,
): Promise<ITokenRefreshResponse> {
  return (
    await axios.post<
      ITokenRefreshRequest,
      AxiosResponse<ITokenRefreshResponse>
    >(
      "/token",
      {
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      } satisfies ITokenRefreshRequest,
      {
        baseURL: OAUTH_URL_BASE,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.NK_CLIENT_ID}:${process.env.NK_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
      },
    )
  ).data;
}
