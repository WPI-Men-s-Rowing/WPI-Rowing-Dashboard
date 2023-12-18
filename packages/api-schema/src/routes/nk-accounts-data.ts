// Create a contract
import { device, notFoundError, session, stroke } from "#components";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const contract = initContract();

// Create a router from the contract, and export it
export default contract.router(
  {
    getSession: {
      method: "GET",
      path: "/:accountId/data/sessions/:sessionId",
      responses: {
        200: session,
        404: notFoundError,
      },
      description: "Get a singular session from a singular account by its ID",
      pathParams: z.strictObject({
        accountId: z.coerce.number().describe("The account ID"),
        sessionId: z.coerce.number().describe("The session ID"),
      }),
    },
    getSessions: {
      method: "GET",
      path: "/:accountId/data/sessions",
      responses: {
        200: z.strictObject({
          sessions: z.array(session).describe("The sessions retrieved"),
        }),
        404: notFoundError,
      },
      description: "Get all sessions associated with an NK account",
      pathParams: z.strictObject({
        accountId: z.coerce.number().describe("The account ID"),
      }),
      query: z.strictObject({
        minElapsedTime: z.coerce
          .number()
          .optional()
          .describe("Minimum session length (ms) to include in responses"),
        maxElapsedTime: z.coerce
          .number()
          .optional()
          .describe("Maximum session length (ms) to include in responses"),
        minTotalDist: z.coerce
          .number()
          .optional()
          .describe("Minimum total distance (meters) to include in responses"),
        maxTotalDist: z.coerce
          .number()
          .optional()
          .describe("Maximum total distance (meters) to include in responses"),
        minStrokeCount: z.coerce
          .number()
          .optional()
          .describe("Minimum stroke count to include in responses"),
        maxStrokeCount: z.coerce
          .number()
          .optional()
          .describe("Maximum stroke count to include in responses"),
        minAvgDistPerStroke: z.coerce
          .number()
          .optional()
          .describe(
            "Minimum average distance per stroke (meters/stroke) to include in responses",
          ),
        maxAvgDistPerStroke: z.coerce
          .number()
          .optional()
          .describe(
            "Maximum average distance per stroke (meters/stroke) to include in responses",
          ),
        minAvgStrokeRate: z.coerce
          .number()
          .optional()
          .describe(
            "Minimum average stroke rate (strokes/minute) to include in responses",
          ),
        maxAvgStrokeRate: z.coerce
          .number()
          .optional()
          .describe(
            "Maximum average stroke rate (strokes/minute) to include in responses",
          ),
        minAvgSpeed: z.coerce
          .number()
          .optional()
          .describe(
            "Minimum average speed (meters/second) to include in responses",
          ),
        maxAvgSpeed: z.coerce
          .number()
          .optional()
          .describe(
            "Maximum average speed (meters/second) to include in responses",
          ),
        minStartTime: z.coerce
          .date()
          .optional()
          .describe(
            "Minimum start time to include in responses. Sessions will be compared as if they are in Z time",
          ),
        maxStartTime: z.coerce
          .date()
          .optional()
          .describe(
            "Maximum start time to include in responses. Sessions will be compared as if they are in Z time",
          ),
        minEndTime: z.coerce
          .date()
          .optional()
          .describe(
            "Minimum end time to include in responses. Sessions will be compared as if they are in Z time",
          ),
        maxEndTime: z.coerce
          .date()
          .optional()
          .describe(
            "Maximum end time to include in responses. Sessions will be compared as if they are in Z time",
          ),
        minStartGpsLat: z.coerce
          .number()
          .optional()
          .describe("Minimum starting GPS latitude to include in responses"),
        maxStartGpsLat: z.coerce
          .number()
          .optional()
          .describe("Maximum starting GPS latitude to include in responses"),
        minStartGpsLon: z.coerce
          .number()
          .optional()
          .describe("Minimum starting GPS longitude to include in responses"),
        maxStartGpsLon: z.coerce
          .number()
          .optional()
          .describe("Maximum starting GPS longitude to include in responses"),
      }),
    },
    getSessionStrokes: {
      method: "GET",
      path: "/:accountId/data/sessions/:sessionId/strokes",
      responses: {
        200: z.strictObject({
          strokes: z.array(stroke).describe("Retrieved strokes"),
        }),
        404: notFoundError,
      },
      description: "Gets all strokes associated with a session",
      pathParams: z.strictObject({
        accountId: z.coerce.number().describe("The account ID"),
        sessionId: z.coerce.number().describe("The session ID"),
      }),
    },
    getSessionStroke: {
      method: "GET",
      path: "/:accountId/data/sessions/:sessionId/strokes/:strokeId",
      responses: { 200: stroke, 404: notFoundError },
      description: "Gets a singular stroke associated with a session by its ID",
      pathParams: z.strictObject({
        accountId: z.coerce.number().describe("The account ID"),
        sessionId: z.coerce.number().describe("The session ID"),
        strokeId: z.coerce.number().describe("The stroke ID"),
      }),
    },
    getDevice: {
      method: "GET",
      path: "/:accountId/data/devices/:deviceId",
      responses: { 200: device, 404: notFoundError },
      description: "Gets all devices associated with an account by its ID",
      pathParams: z.strictObject({
        accountId: z.coerce.number().describe("The account ID"),
        deviceId: z.coerce.number().describe("The device ID"),
      }),
    },
    getDevices: {
      method: "GET",
      path: "/:accountId/data/devices",
      responses: {
        200: z.strictObject({
          devices: z.array(device).describe("The retrieved devices"),
        }),
        404: notFoundError,
      },
      description: "Gets all devices associated with an account",
      pathParams: z.strictObject({
        accountId: z.coerce.number().describe("The account ID"),
      }),
    },
  },
  {},
);
