// Create a contract
import { notFoundError } from "#components";
import { initContract } from "@ts-rest/core";
import { z } from "zod";

/**
 * Type representing a singular stroke from a singular session
 */
export const stroke = z.strictObject({
  /**
   * @type {number} - ID of the stroke
   */
  id: z.number(),
  /**
   * @type {Date} - timestamp of the stroke
   */
  timestamp: z.date(),
  /**
   * @type {number} - latitude location of the stroke
   */
  latitude: z.number(),
  /**
   * @type {number} - longitude location of the stroke
   */
  longitude: z.number(),
  /**
   * @type {number} - instantaneous speed of the stroke in meters/second
   */
  speed: z.number(),
  /**
   * @type {number} - total distance gone over in the session to this point
   */
  totalDistance: z.number(),
  /**
   * @type {number} - total elapsed time in the session to this point
   */
  elapsedTime: z.number(),
  /**
   * @type {number} - instantaneous distance per stroke (meters/stroke)
   */
  distPerStroke: z.number(),
  /**
   * @type {number} - instantaneous stroke rate to this point (strokes/minute)
   */
  strokeRate: z.number(),
  /**
   * @type {number} - total number of strokes taken in the session to this point
   */
  strokeCount: z.number(),
});

/**
 * Type representing a singular session
 */
export const session = z.strictObject({
  /**
   * @type {number} - unique ID for the session
   */
  id: z.number(),
  /**
   * @type {string} - human-readable description for the session
   */
  description: z.string(),
  /**
   * @type {string} - human-readable location description
   */
  locationDescription: z.string(),
  /**
   * @type {number} - total distance covered in the session
   */
  totalDistance: z.number(),
  /**
   * @type {number} - average distance per stroke (meters/stroke) through the piesessionce
   */
  avgDistPerStroke: z.number(),
  /**
   * @type {number} - average stroke rate over the session (strokes/minute)
   */
  avgStrokeRate: z.number(),
  /**
   * @type {number} - average speed through the session (meters/second)
   */
  avgSpeed: z.number(),
  /**
   * @type {Date} - start date/time in GMT (but the time is the local session time)
   */
  startTime: z.date(),
  /**
   * @type {Date} - end date/time in GMT (but the time is the local session time)
   */
  endTime: z.date(),
  /**
   * @type {number} - duration of the session in MS
   */
  duration: z.number(),
  /**
   * @type {number} - number of strokes taken in the session
   */
  strokeCount: z.number(),
  /**
   * @type {number} - the starting GPS latitude of the session
   */
  startGpsLat: z.number(), // Session start latitude
  /**
   * @type {number} - the ending GPS longitude of the session
   */
  startGpsLon: z.number(),
  /**
   * @type {number} - the ID of the device used to capture the session
   */
  deviceId: z.number(),
  /**
   * @type {Array} - if the session type is intervals, this will have the recorded intervals. Otherwise, this will be empty
   */
  intervals: z.array(
    z.strictObject({
      /**
       * @type {number} - unique ID for the interval
       */
      id: z.number(),
      /**
       * @type {number} - total distance covered up to this point (meters)
       */
      distance: z.number(),
      /**
       * @type {number} - average distance per stroke over the interval (meters/stroke)
       */
      avgDistPerStroke: z.number(),
      /**
       * @type {number} - average stroke rate over the interval (strokes/minute)
       */
      avgStrokeRate: z.number(),
      /**
       * @type {number} - average speed over the interval (meters/stroke)
       */
      avgSpeed: z.number(),
      /**
       * @type {Date} - start date/time in GMT (but the time is the local session time)
       */
      startTime: z.date(),
      /**
       * @type {number} - time elapsed to the start of this interval in MS
       */
      elapsedTime: z.number(),
      /**
       * @type {number} the number of strokes taken in the interval
       */
      strokeCount: z.number(),
      /**
       * @type {number} - the starting GPS latitude of the piece
       */
      startGpsLat: z.number(),
      /**
       * @type {number} - the starting GPS longitude of the piece
       */
      startGpsLon: z.number(),
    }),
  ),
});

/**
 * Type for a singular device
 */
export const device = z.strictObject({
  /**
   * @type {number} - the ID of the device
   */
  id: z.number(),
  /**
   * @type {number} - the possibilities for device type
   */
  type: z.enum(["SpeedCoach", "CoxBox"]),
  /**
   * @type {string} - human-readable device model name
   */
  model: z.string(),
  /**
   * @type {string} - human-assigned device name
   */
  name: z.string(),
  /**
   * @type {string} - firmware version running on the device
   */
  firmwareVersion: z.string(),
  /**
   * @type {string} - hardware version running on the device
   */
  hardwareVersion: z.string(),
  /**
   * @type {string} - serial number running on the device
   */
  serialNumber: z.string(),
  /**
   * @type {string} - manufacturer name of the device
   */
  manufacturerName: z.string(),
  /**
   * @type {string} - BLE profile version running on the device
   */
  profileVersion: z.string(),
});

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
        /**
         * @type {number} - the account ID
         */
        accountId: z.number(),
        /**
         * @type {number} - the session ID
         */
        sessionId: z.number(),
      }),
    },
    getSessions: {
      method: "GET",
      path: "/:accountId/data/sessions",
      responses: {
        200: z.strictObject({
          sessions: z.array(session),
        }),
        404: notFoundError,
      },
      description: "Get all sessions associated with an NK account",
      pathParams: z.strictObject({
        /**
         * @type {number} - the account ID
         */
        accountId: z.number(),
      }),
      query: z.strictObject({
        /**
         * @type {number} - minimum session length (ms) to include in responses
         */
        minElapsedTime: z.number().optional(),
        /**
         * @type {number} - maximum session length (ms) to include in responses
         */
        maxElapsedTime: z.number().optional(),
        /**
         * @type {number} - minimum total distance (meters) to include in responses
         */
        minTotalDist: z.number().optional(),
        /**
         * @type {number} - maximum total distance (meters) to include in responses
         */
        maxTotalDist: z.number().optional(),
        /**
         * @type {number} - minimum stroke count to include in responses
         */
        minStrokeCount: z.number().optional(),
        /**
         * @type {number} - maximum stroke count to include in responses
         */
        maxStrokeCount: z.number().optional(),
        /**
         * @type {number} - minimum average distance per stroke (meters/stroke) to include in responses
         */
        minAvgDistPerStroke: z.number().optional(),
        /**
         * @type {number} - maximum average distance per stroke (meters/stroke) to include in responses
         */
        maxAvgDistPerStroke: z.number().optional(),
        /**
         * @type {number} - minimum average stroke rate (strokes/minute) to include in responses
         */
        minAvgStrokeRate: z.number().optional(),
        /**
         * @type {number} - maximum average stroke rate (strokes/minute) to include in responses
         */
        maxAvgStrokeRate: z.number().optional(),
        /**
         * @type {number} - minimum average speed (meters/second) to include in responses
         */
        minAvgSpeed: z.number().optional(),
        /**
         * @type {number} - maximum average speed (meters/second) to include in responses
         */
        maxAvgSpeed: z.number().optional(),
        /**
         * @type {Date} - minimum start time to include in responses. Sessions will be compared as if they are in Z time
         */
        minStartTime: z.date().optional(),
        /**
         * @type {Date} - maximum start time to include in responses. Sessions will be compared as if they are in Z time
         */
        maxStartTime: z.date().optional(),
        /**
         * @type {Date} - minimum end time to include in responses. Sessions will be compared as if they are in Z time
         */
        minEndTime: z.date().optional(),
        /**
         * @type {Date} - maximum end time to include in responses. Sessions will be compared as if they are in Z time
         */
        maxEndTime: z.date().optional(),
        /**
         * @type {number} - minimum starting GPS latitude to include in responses
         */
        minStartGpsLat: z.number().optional(),
        /**
         * @type {number} - maximum starting GPS latitude to include in responses
         */
        maxStartGpsLat: z.number().optional(),
        /**
         * @type {number} - minimum starting GPS longitude to include in responses
         */
        minStartGpsLon: z.number().optional(),
        /**
         * @type {number} - maximum starting GPS longitude to include in responses
         */
        maxStartGpsLon: z.number().optional(),
      }),
    },
    getSessionStrokes: {
      method: "GET",
      path: "/:accountId/data/sessions/:sessionId/strokes",
      responses: {
        200: z.strictObject({
          strokes: z.array(stroke),
        }),
        404: notFoundError,
      },
      description: "Gets all strokes associated with a session",
      pathParams: z.strictObject({
        /**
         * @type {number} - the account ID
         */
        accountId: z.number(),
        /**
         * @type {number} - the session ID
         */
        sessionId: z.number(),
      }),
    },
    getSessionStroke: {
      method: "GET",
      path: "/:accountId/data/sessions/:sessionId/strokes/:strokeId",
      responses: { 200: stroke, 404: notFoundError },
      description: "Gets a singular stroke associated with a session by its ID",
      pathParams: z.strictObject({
        /**
         * @type {number} - the account ID
         */
        accountId: z.number(),
        /**
         * @type {number} - the session ID
         */
        sessionId: z.number(),
        /**
         * @type {number} - the stroke ID
         */
        strokeId: z.number(),
      }),
    },
    getDevice: {
      method: "GET",
      path: "/:accountId/data/devices/:deviceId",
      responses: { 200: device, 404: notFoundError },
      description: "Gets all devices associated with an account by its ID",
      pathParams: z.strictObject({
        /**
         * @type {number} - the account ID
         */
        accountId: z.number(),
        /**
         * @type {number} - the device ID
         */
        deviceId: z.number(),
      }),
    },
    getDevices: {
      method: "GET",
      path: "/:accountId/data/devices",
      responses: {
        200: z.strictObject({
          devices: z.array(device),
        }),
        404: notFoundError,
      },
      description: "Gets all devices associated with an account",
      pathParams: z.strictObject({
        /**
         * @type {number} - the account ID
         */
        accountId: z.number(),
      }),
    },
  },
  {},
);
