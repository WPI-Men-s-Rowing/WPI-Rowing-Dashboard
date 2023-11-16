import { nanoid } from "nanoid";
import qs from "qs";
import { z } from "zod";

// NK Auth Redirect path location
export const NkAuthRedirectPath = "/nk-auth-redirect";

/**
 * Handles an NK login request, saving the necessary items in local storage
 * and redirecting to NK with the required parameters
 * @param state the application redirection data, as provided by the client
 */
export function handleNkLoginRequest(state: Record<string, string>): void {
  // Create a secure ID to pass with state
  const id = nanoid(15);

  // Session data, include the current URL and the expiry for this token
  const sessionData: z.infer<typeof LocalStorageData> = {
    state: state,
    expiresOn: Date.now() + 60 * 1000,
  };

  // Save the session
  localStorage.setItem(id, JSON.stringify(sessionData));

  // Redirect to the NK oauth provider
  window.location.assign(
    "https://oauth-logbook.nksports.com/oauth/authorize?" +
      qs.stringify({
        response_type: "code",
        // Look in the env file for the client id
        client_id: import.meta.env.VITE_NK_CLIENT_ID as string,
        redirect_uri: window.location.origin + NkAuthRedirectPath,
        scope: "read",
        state: id,
      } satisfies ICodeRequestQueryParams),
  );
}

/**
 * Handles the return from a NK login redirect. Assumes the current URL
 * contains the data required for processing. Then, cleans up local storage
 * @returns the code generated by the NK login attempt, along with the desired redirect URL
 * @throws {Error} if the redirect attempt isn't valid due to the state
 * not matching locally stored state (e.g., this is expired OR from a phishing/CSRF attempt).
 * In this case, local storage will STILL BE CLEANED
 */
export function handleNkLoginReturn() {
  // Parse the URL search parameters, so we have the desired data
  const urlParams = RedirectReturnData.safeParse(qs.parse(location.search));

  // Validate that we have the code and state (as we need both)
  if (!urlParams.success) {
    CleanupLocalStorage(); // Cleanup local storage before throwing
    throw new Error("Redirect missing code/state!");
  }

  // Get the state out of the local storage
  const stateBodyString = localStorage.getItem(urlParams.data.state);

  CleanupLocalStorage(); // Cleanup the local storage now

  // Validate we actually have the body
  if (stateBodyString == null) {
    throw new Error("Missing state in local storage!");
  }

  // Now parse the body into JSON
  const stateBody = LocalStorageData.parse(stateBodyString);

  // Validate the attempt has expired
  if (stateBody.expiresOn < Date.now()) {
    throw new Error("Redirect attempt expired!"); // Notify that something went wrong
  }

  // Return the data
  return { state: stateBody.state, code: urlParams.data.code };
}

/**
 * Function that cleans up all redirect attempts in local storage, ensuring
 * that bogus data is not persisted
 */
export function CleanupLocalStorage() {
  for (let i = 0; i < localStorage.length; i++) {
    // Get the information about the storage
    const storageKey = localStorage.key(i)!;
    let storageItem: unknown;

    // If the redirect fails, just ignore it
    try {
      storageItem = JSON.parse(localStorage.getItem(storageKey)!)!;
    } catch (Error) {
      continue;
    }

    // If this is redirect data, remove it
    if (LocalStorageData.safeParse(storageItem).success) {
      localStorage.removeItem(storageKey);
      i--; // Decrement teh counter
    }
  }
}

/**
 * Query parameters for the code request
 */
interface ICodeRequestQueryParams {
  response_type: "code"; // Required
  client_id: string; // Required client ID
  redirect_uri: string; // Redirect URI
  scope: string; // The scopes to use, space separated list
  state: string; // The state to use
}

/**
 * Data returned by the redirect attempt, code and state must be returned
 */
const RedirectReturnData = z.strictObject({
  code: z.string(),
  state: z.string(),
});

/**
 * Interface that stores redirect data, including the path to redirect to
 * and the expiry for that path. Meant to be used internally and stored in local storage
 */
const LocalStorageData = z
  .strictObject({
    /**
     * The desired redirect data
     */
    state: z.record(z.string(), z.string()),

    /**
     * The time from the epoch in ms that this redirect attempt expires
     */
    expiresOn: z.coerce.number(),
  })
  .strict();
