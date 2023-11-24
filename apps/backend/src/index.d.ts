declare namespace NodeJS {
  /**
   * Override types for process.env
   */
  interface ProcessEnv {
    /**
     * Client ID for NK
     */
    readonly NK_CLIENT_ID: string;
    /**
     * Client secret for NK
     */
    readonly NK_CLIENT_SECRET: string;
    /**
     * Redirect URL for NK
     */
    readonly NK_REDIRECT_URI: string;
    /**
     * Database URL for NK
     */
    readonly DATABASE_URL: string;
    /**
     * Possible node environment types
     */
    readonly NODE_ENV: "development" | "production" | "test";
  }
}
