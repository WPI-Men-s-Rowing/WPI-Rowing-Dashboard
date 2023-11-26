declare namespace NodeJS {
  /**
   * Override types for process.env
   */
  interface ProcessEnv {
    /**
     * URL the backend is running on
     */
    readonly BACKEND_URL: string;

    /**
     * String of the port the backend is running on
     */
    readonly BACKEND_PORT: string;
  }
}
