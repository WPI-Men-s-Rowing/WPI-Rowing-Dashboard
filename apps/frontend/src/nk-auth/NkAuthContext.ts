import { createContext } from "react";

// Create the NkAuthContext and export it so it can be imported elsewhere. The default will simply throw, as it
// should be replaced elsewhere
export const NkAuthContext = createContext<INkAuthContext>({
  handleNkLogin: () => {
    throw new Error(
      "Cannot use NkAuth Hook without wrapping the target component in an NkAuthProvider!",
    );
  },
} satisfies INkAuthContext);

/**
 * Interface containing the props the INkAuthContext provides, including the login method
 */
export interface INkAuthContext {
  /**
   * Method to handle an NK Login request
   * @param appState the application state to persist. This will be passed back
   * to the NkAuthProvider's redirectCallback method when a redirect is processed
   */
  handleNkLogin: (appState: Record<string, string>) => void;
}
