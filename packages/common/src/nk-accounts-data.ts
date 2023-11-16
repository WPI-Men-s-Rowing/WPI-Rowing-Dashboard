import { z } from "zod";

/**
 * Type that will be returned when attempting to get all the strokes associated with a session
 */
export const GetStrokesResponse = z
  .strictObject({
    strokes: z.array(
      z
        .strictObject({
          id: z.coerce.number(), // ID of the stroke
          timestamp: z.coerce.date(), // Timestamp of the stroke
          latitude: z.coerce.number(), // Latitude of the stroke
          longitude: z.coerce.number(), // Longitude of the stroke
          speed: z.coerce.number(), // Instantaneous GPS speed
          totalDistance: z.coerce.number(), // Total distance in the session to this point
          elapsedTime: z.coerce.number(), // Elapsed time in the session
          distPerStroke: z.coerce.number(), // Instantaneous distance/stroke
          strokeRate: z.coerce.number(), // Instantaneous stroke rate
          strokeCount: z.coerce.number(), // Stroke count up to this point
        })
        .strict(),
    ),
  })
  .strict();

/**
 * Response type to be used when getting a singular stroke
 */
export const GetSessionResponse = z
  .strictObject({
    id: z.coerce.number(), // Unique ID for the session
    description: z.string(), // Description for the piece
    locationDescription: z.string(), // Human-readable location description
    totalDistance: z.coerce.number(), // Total distance covered in the session
    avgDistPerStroke: z.coerce.number(), // Average distance per stroke over the piece
    avgStrokeRate: z.coerce.number(), // Average stroke rate over the piece
    avgSpeed: z.coerce.number(), // Average speed in meters/stroke
    startTime: z.coerce.date(), // Start date/time. This will be sent over the wire as a string in JSON form
    endTime: z.coerce.date(), // End date/time. This will be sent over the wire as a string in JSON form
    duration: z.coerce.number(), // Duration in MS
    strokeCount: z.coerce.number(), // Number of strokes taken in the session
    startGpsLat: z.coerce.number(), // Session start latitude
    startGpsLon: z.coerce.number(), // Session start longitude
    deviceId: z.coerce.number(), // ID of the device used to capture the session
    intervals: z.array(
      z
        .strictObject({
          // If the session type is intervals, this will have the recorded intervals. Otherwise, this will be empty
          id: z.coerce.number(), // Unique ID for the interval
          distance: z.coerce.number(), // Total distance covered in the interval
          avgDistPerStroke: z.coerce.number(), // Average distance per stroke over the interval
          avgStrokeRate: z.coerce.number(), // Average stroke rate over the interval
          avgSpeed: z.coerce.number(), // Average speed in meters/stroke over the interval
          startTime: z.coerce.date(), // Interval start date/time. This will be sent over the wire as a string in JSON form
          endTime: z.coerce.date(), // Interval end date/time. This will be sent over the wire as a string in JSON form
          duration: z.coerce.number(), // Interval duration in MS
          strokeCount: z.coerce.number(), // Interval number of strokes taken in the session
          startGpsLat: z.coerce.number(), // Interval session start latitude
          startGpsLon: z.coerce.number(), // Interval session start longitude
        })
        .strict(),
    ),
  })
  .strict();

/**
 * Type returned for getting all sessions associated with an account
 */
export const GetSessionsResponse = z
  .strictObject({
    sessions: z.array(GetSessionResponse),
  })
  .strict();

/**
 * Zod schema representing the query parameters that can be provided to
 */
export const GetSessionsQueryParams = z
  .strictObject({
    minElapsedTime: z.coerce.number().optional(), // Minimum elapsed time
    maxElapsedTime: z.coerce.number().optional(), // Maximum elapsed time
    minTotalDist: z.coerce.number().optional(), // Minimum total distance
    maxTotalDist: z.coerce.number().optional(), // Maximum total distance
    minStrokeCount: z.coerce.number().optional(), // Minimum stroke count
    maxStrokeCount: z.coerce.number().optional(), // Maximum stroke count
    minAvgDistPerStroke: z.coerce.number().optional(), // Minimum distance per stroke (meters/stroke)
    maxAvgDistPerStroke: z.coerce.number().optional(), // Maximum distance per stroke (meters/stroke)
    minAvgStrokeRate: z.coerce.number().optional(), // Minimum average stroke rate
    maxAvgStrokeRate: z.coerce.number().optional(), // Maximum average stroke rate
    minAvgSpeed: z.coerce.number().optional(), // Minimum average speed (in meters/second)
    maxAvgSpeed: z.coerce.number().optional(), // Maximum average speed (in meters/second)
    startTimeMin: z.coerce.date().optional(), // Minimum start time (send this over the wire as an ISO string)
    startTimeMax: z.coerce.date().optional(), // Maximum start time (send this over the wire as an ISO string)
    endTimeMin: z.coerce.date().optional(), // Minimum end time (send this over the wire as an ISO string)
    endTimeMax: z.coerce.date().optional(), // Maximum end time (send this over the wire as an ISO string)
    startGpsLatMin: z.coerce.number().optional(), // Minimum start GPS latitude
    startGpsLatMax: z.coerce.number().optional(), // Maximum start GPS latitude
    startGpsLonMin: z.coerce.number().optional(), // Minimum start GPS longitude
    startGpsLonMax: z.coerce.number().optional(), // Maximum start GPS longitude
  })
  .strict();
