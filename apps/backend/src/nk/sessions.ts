import axios from "axios";
import { URLSearchParams } from "url";

// URL base for all sessions requests
const SESSIONS_URL_BASE = "https://logbook-api.nksports.com/api/v1";

/**
 * URL Params for fetching sessions
 */
interface ISessionsRequestUrlParams {
  before?: number; // Time (inclusive, in MS from epoch) to limit sessions to. Sessions must end after this to be included. Optional
  after?: number; // Time (inclusive, in MS from epoch). Sessions must end before this to be included. Optional
}

/**
 * Response type from the NK API for a singular session
 * NOTE: The API returns an array of these with NO JSON WRAPPING. So,
 * when using this type with axios, use <ISingularSessionResponse[]>.
 * Note: Any missing data defaults to 0.0. So, if there is no impeller,
 * HRM, EMPower OarLock, etc, it will be 0.0
 */
interface ISingularSessionResponse {
  elapsedTime: number; // Session time, in MS
  totalDistanceImp: number; // Distance in the session with an impeller used for data
  totalDistanceGps: number; // Distance in the session with the GPS used for data
  avgPaceImp: number; // Average pace (in ms/500m) with the impeller
  avgPaceGps: number; // Average pace (in ms/500m) with the GPS
  avgStrokeRate: number; // Average stroke rate in strokes/min
  distStrokeImp: number; // Distance per stroke (in m/stroke) with the impeller
  distStrokeGps: number; // Distance per stroke (in m/stroke) with the GPS
  avgHeartRate: number; // Average heart rate (in beats per min)
  totalStrokeCount: number; // Total strokes
  totalCalories: number; // Calculated from HR data
  avgCalHour: number; // Calculated from HR data and time
  avgSpeedGps: number; // Average speed from the GPS (in m/s)
  avgSpeedImp: number; // Average speed from the impeller (in m/s)
  avgPower: number; // Average power from the EmPower Oarlocks connected
  avgCatch: number; // Average catch angle from the EmPower Oarlocks connected
  avgSlip: number; // Average slip angle from the EmPower Oarlocks connected
  avgFinish: number; // Average finish angle from the EmPower Oarlocks connected
  avgWash: number; // Average wash from the EmPower Oarlocks connected
  avgForceAvg: number; // Average force over a stroke from the EmPower Oarlocks connected
  avgWork: number; // Average work from the EmPower Oarlocks connected
  avgForceMax: number; // Average max force from the EmPower Oarlocks connected
  avgMaxForceAngle: number; // Average max force angle from the EmPower Oarlocks connected
  startGpsLat: number; // Start GPS latitude location
  startGpsLon: number; // Start GPS longitude location
  id: number; // Unique ID of this session. Can be used to fetch
  name: string; // Human-readable name of the session
  type: 0 | 1 | 2 | 3; // Type of the session. 0 for JustGo, 1 for single distance, 2 for single time, 3 for intervals
  speedInput: 0 | 1; // Where speed is coming from, 0 for GPS, 1 for impeller
  startTime: number; // Start time in MS since the epoch in the time zone this was recorded in (ew)
  endTime: number; // End time in MS since the epoch in the time zone this was recorded in (ew)
  location: string; // Human-readable string where the data was recorded from
  deviceId: number; // The device ID this was recorded on
  intervals: // Intervals for the session.
  // Unless the session type is 3 (see above), this will have one field containing identical data to the above.
  // Thanks NK!
  {
    elapsedTime: number; // Session time, in MS
    totalDistanceImp: number; // Distance in the session with an impeller used for data
    totalDistanceGps: number; // Distance in the session with the GPS used for data
    avgPaceImp: number; // Average pace (in ms/500m) with the impeller
    avgPaceGps: number; // Average pace (in ms/500m) with the GPS
    avgStrokeRate: number; // Average stroke rate in strokes/min
    distStrokeImp: number; // Distance per stroke (in m/stroke) with the impeller
    distStrokeGps: number; // Distance per stroke (in m/stroke) with the GPS
    avgHeartRate: number; // Average heart rate (in beats per min)
    totalStrokeCount: number; // Total strokes
    totalCalories: number; // Calculated from HR data
    avgCalHour: number; // Calculated from HR data and time
    avgSpeedGps: number; // Average speed from the GPS (in m/s)
    avgSpeedImp: number; // Average speed from the impeller (in m/s)
    avgPower: number; // Average power from the EmPower Oarlocks connected
    avgCatch: number; // Average catch angle from the EmPower Oarlocks connected
    avgSlip: number; // Average slip angle from the EmPower Oarlocks connected
    avgFinish: number; // Average finish angle from the EmPower Oarlocks connected
    avgWash: number; // Average wash from the EmPower Oarlocks connected
    avgForceAvg: number; // Average force over a stroke from the EmPower Oarlocks connected
    avgWork: number; // Average work from the EmPower Oarlocks connected
    avgForceMax: number; // Average max force from the EmPower Oarlocks connected
    avgMaxForceAngle: number; // Average max force angle from the EmPower Oarlocks connected
    startGpsLat: number; // Start GPS latitude location
    startGpsLon: number; // Start GPS longitude location
    id: number; // The ID of the interval. This is different from the session ID, even for type 0/1/2 above
    sessionId: number; // The ID of the session. This is the same as the session ID above for all cases
    startTime: number; // Start time in MS since the epoch in the time zone this was recorded in (ew)
    intervalNumber: number; // 1-indexed interval number this is
    sessionStrokeStartIndex: number; // "The stroke record index at which the interval starts".
    // You might think that this should be 0 or 1 for type 0/1/2.
    // You'd be wrong
    sessionStrokeEndIndex: number; // "The stroke record index at which the interval ends".
    // Fortunately, this at least is sessionStrokeStartIndex + sessionStrokeCount - 1
    sessionStrokeCount: number; // The number of strokes records the interval consists of.
    // Closely related to totalStrokeCount but not 1-1
  }[];
  oarlockSessions: // Unless an EmPower oarlock is connected, this will be an empty array.
  // If one is connected, this should have data
  {
    id: number; // ID of the Oarlock session
    sessionId: number; // ID of the session the oarlock session is a part of
    boatName: string; // The boat name
    seatNumber: number; // The seat number saved on the oarlock. 1-8
    portStarboard: 0 | 1; // 0 for port, 1 for starboard. Saved on the oarlock
    oarLength: number; // Oar length saved on the oarlock
    oarInboardLength: number; // Oar inboard length, saved on the oarlock
  }[];
}

// Type to use for the response of fetching sessions
export type ISessionsResponse = ISingularSessionResponse[];

/**
 * URL Parameters for the session strokes request
 */
interface ISessionStrokesRequestUrlParams {
  sessionIds: string; // Comma-separated list of integers, which are the session IDs to get data from. No square brackets
}

/**
 * Type for a singular stroke in a singular session. Do not use this for fetch,
 * see the below type for details on that
 */
interface ISingularSessionSingularStrokeResponse {
  id: number; // ID of the stroke
  timestamp: number; // Time (in ms from epoch) the stroke was taken at
  sessionId: number; // The session ID for the stroke
  sessionIntervalId: number; // The ID of the interval in the stroke the session is from
  type: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // Stroke record type - 0 for stroke interval, 1 for 100m distance interval, 2 for 160m distance interval, 3 for 30s time interval, 4 for timer started, 5 for timer stopped, 6 for absolute distance, 7 for absolute position, 8 for end of session
  elapsedTime: number; // Elapsed time since the beginning of the interval (in ms)
  latitude: number; // Latitude the stroke was taken at
  longitude: number; // Longitude the stroke was taken at
  gpsInstaSpeed: number; // Instantaneous GPS speed (in meters/second)
  impellerInstaSpeed: number; // Instantaneous water speed (in meters/stroke)
  gpsTotalDistance: number; // Accumulated GPS distance to this point (in meters)
  impellerTotalDistance: number; // Accumulated impellers distance to this point (in meters)
  heartRate: number | null; // Instantaneous heart rate (or null if none)
  strokeCount: number; // Strokes taken up to this point in the interval
  strokeRate: number; // Instantaneous stroke rate (in strokes/min)
  totalCaloriesBurned: number; // Calories burned up to this point
  caloriesPerHour: number; // Average calories burned per hour up to this point
  caloriesPerStroke: number; // Average calories burned per stroke up to this point
  gpsDistStroke: number; // Instantaneous GPS stroke distance (in meters)
  impellerDistStroke: number; // Instantaneous impeller stroke distance (in meters)
  gpsPace: 0.0; // Instantaneous GPS split time (in ms/500 meters)
  impellerPace: 0.0; // Instantaneous impeller split time (in ms/500 meters)
  sessionStrokeIndex: 0; // The index number of the stroke in the session
  oarlockStrokes: {
    // The oarlock strokes related to this stroke. Will be empty if no EmPower oarlock
    id: number; // The ID of this oarlock stroke
    sessionStrokeId: number; // The ID of the oarlock stroke this is associated with
    oarlockSessionId: number; // ID of the oarlock session this stroke belongs to
    catchAngle: number; // Catch angle (in angular degrees)
    cycleTime: number; // Cycle time (in ms)
    driveTime: number; // Drive time (in ms)
    effectiveLength: number; // Effective length (in angular degrees)
    finishAngle: number; // Finish angle (in angular degrees)
    handleForceAvg: number; // Handle force average (in newtons)
    maxHandleForce: number; // Max handle force (in newtons)
    positionOfMaxForce: number; // Position of max force (in angular degrees)
    power: number; // Power (in watts)
    realWorkPerStroke: number; // Real work per stroke (in joules)
    slip: number; // Slip angle (in angular degrees)
    timestamp: number; // The timestamp (in ms since the epoch) the stroke was taken at
    totalLength: number; // The total length (in angular degrees)
    wash: number; // The wash angle (in angular degrees)
    seatIndex: number; // The seat this stroke was taken at (1-8)
  }[];
}

/**
 * Type to be used when fetching session strokes. Maps session ID to retrieved strokes
 */
export type ISessionsStrokesResponse = Record<
  string,
  ISingularSessionSingularStrokeResponse[]
>;

/**
 * Async method to fetch sessions according
 * @param before optional date to fetch sessions that end before this (inclusive). Note: sessions define their own timezone, this time will not be put in those terms
 * @param after optional date to fetch sessions that end after this (inclusive). Note: sessions define their own timezone, this time will not be put in those terms
 * @param accessToken the access token to fetch the data with
 * @returns the sessions fetched by this data
 */
export async function fetchSessions(
  accessToken: string,
  before?: Date,
  after?: Date,
): Promise<ISessionsResponse> {
  // Build the request object, including before and after if they exist
  const request: ISessionsRequestUrlParams = {};
  if (before) {
    request.before = before.getTime(); // Convert to epoch time (as per what NK wants)
  }
  if (after) {
    request.after = after.getTime(); // Convert to epoch time (as per what NK wants)
  }

  return (
    await axios.get<ISessionsResponse>(
      "/sessions?" + new URLSearchParams(Object.entries(request)).toString(),
      {
        baseURL: SESSIONS_URL_BASE,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  ).data;
}

/**
 * Fetches the strokes in the provided sessions
 * @param accessToken the access token to fetch the data with
 * @param sessions the sessions IDs to fetch the data for
 * @returns the data fetched for the provided sessions
 */
export async function fetchStrokes(
  accessToken: string,
  sessions: number[],
): Promise<ISessionsStrokesResponse> {
  return (
    await axios.get<ISessionsStrokesResponse>(
      "/sessions/strokes" +
        new URLSearchParams({
          sessionIds: sessions.join(","),
        } satisfies ISessionStrokesRequestUrlParams).toString(),
      {
        baseURL: SESSIONS_URL_BASE,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  ).data;
}
