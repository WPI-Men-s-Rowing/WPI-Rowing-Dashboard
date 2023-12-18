import { z } from "zod";

export const stroke = z
  .strictObject({
    id: z.number().describe("ID of the stroke"),
    timestamp: z.date().describe("Timestamp of the stroke"),
    latitude: z.number().describe("Latitude location of the stroke"),
    longitude: z.number().describe("Longitude location of the stroke"),
    speed: z
      .number()
      .describe("Instantaneous speed of the stroke in meters/second"),
    totalDistance: z
      .number()
      .describe("Total distance gone over in the session to this point"),
    elapsedTime: z
      .number()
      .describe("Total elapsed time in the session to this point"),
    distPerStroke: z
      .number()
      .describe("Instantaneous distance per stroke (meters/stroke)"),
    strokeRate: z
      .number()
      .describe("Instantaneous stroke rate to this point (strokes/minute)"),
    strokeCount: z
      .number()
      .describe("Total number of strokes taken in the session to this point"),
  })
  .describe("A singular stroke from a singular session");

export const session = z
  .strictObject({
    id: z.number().describe("Unique ID for the session"),
    description: z
      .string()
      .describe("Human-readable description for the session"),
    locationDescription: z
      .string()
      .nullable()
      .describe("Human-readable location description"),
    totalDistance: z.number().describe("Total distance covered in the session"),
    avgDistPerStroke: z
      .number()
      .describe(
        "Average distance per stroke (meters/stroke) through the piece",
      ),
    avgStrokeRate: z
      .number()
      .describe("Average stroke rate over the session (strokes/minute)"),
    avgSpeed: z
      .number()
      .describe("Average speed through the session (meters/second)"),
    startTime: z
      .date()
      .describe(
        "Start date/time in GMT (but the time is the local session time)",
      ),
    endTime: z
      .date()
      .describe(
        "End date/time in GMT (but the time is the local session time)",
      ),
    duration: z.number().describe("Duration of the session in MS"),
    strokeCount: z.number().describe("Number of strokes taken in the session"),
    startGpsLat: z
      .number()
      .describe("The starting GPS latitude of the session"),
    startGpsLon: z.number().describe("The ending GPS longitude of the session"),
    deviceId: z
      .number()
      .nullable()
      .describe("The ID of the device used to capture the session"),
    intervals: z.array(
      z.strictObject({
        id: z.number().describe("Unique ID for the interval"),
        distance: z.number().describe("Total distance covered in the interval"),
        avgDistPerStroke: z
          .number()
          .describe(
            "Average distance per stroke over the interval (meters/stroke)",
          ),
        avgStrokeRate: z
          .number()
          .describe("Average stroke rate over the interval (strokes/minute)"),
        avgSpeed: z
          .number()
          .describe("Average speed over the interval (meters/stroke)"),
        startTime: z
          .date()
          .describe(
            "Start date/time in GMT (but the time is the local session time)",
          ),
        duration: z.number().describe("The time of the interval"),
        strokeCount: z
          .number()
          .describe("The number of strokes taken in the interval"),
        startGpsLat: z
          .number()
          .describe("The starting GPS latitude of the piece"),
        startGpsLon: z
          .number()
          .describe("The starting GPS longitude of the piece"),
      }),
    ),
  })
  .describe(
    "If the session type is intervals, this will have the recorded intervals. Otherwise, this will be empty",
  )
  .describe("Singular session, containing overall session data");

/**
 * Type for a singular device
 */
export const device = z
  .strictObject({
    id: z.number().describe("The ID of the device"),
    type: z
      .enum(["SpeedCoach", "CoxBox"])
      .describe("The possibilities for device type"),
    model: z.string().describe("Human-readable device model name"),
    name: z.string().describe("Human-assigned device name"),
    firmwareVersion: z
      .string()
      .describe("Firmware version running on the device"),
    hardwareVersion: z
      .string()
      .describe("Hardware version running on the device"),
    serialNumber: z.string().describe("Serial number running on the device"),
    manufacturerName: z.string().describe("Manufacturer name of the device"),
    profileVersion: z
      .string()
      .describe("BLE profile version running on the device"),
  })
  .describe("Device containing basic information");

/**
 * An NK Account schema type, with information that would be returned
 * by a request for an NK Account
 */
export const nKAccount = z
  .strictObject({
    firstName: z.string().describe("The first name assigned to the account"),
    lastName: z.string().describe("The last name assigned to the account"),
    userId: z.number().describe("The user's ID (assigned by NK)"),
    ownTeamId: z.number().describe("The user's team ID (assigned by NK)"),
  })
  .describe("Basic information about an NK Account");
