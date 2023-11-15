/**
 * Type returned for getting all sessions associated with an account
 */
export interface IGetSessionsResponse {
  sessions: IGetSessionsByIdResponse[]; // The sessions returned
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IGetSessionsByIdResponse {}
