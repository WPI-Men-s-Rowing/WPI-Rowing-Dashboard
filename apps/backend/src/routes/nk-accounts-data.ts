import {
  GetSessionResponse,
  GetSessionsQueryParams,
  GetSessionsResponse,
  GetStrokeResponse,
  GetStrokesResponse,
  IErrorResponse,
} from "common";
import { prisma } from "database";
import express, { Request, Response, Router } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { IRequestWithId, validateHasId } from "../middleware/validateHasId.ts";
import { handleTokenRefresh } from "../nk/oauth.ts";
import {
  ISingularSessionResponse,
  ISingularSessionSingularStrokeResponse,
  fetchSessions,
  fetchStrokes,
} from "../nk/sessions.ts";

/**
 * Gets tha access token for a given user ID, refreshing using the refresh token
 * if necessary
 * @param userId the user ID to get a token from
 */
async function getAccessToken(userId: number): Promise<string> {
  // Get the user the token is associated with
  const user = await prisma.nkCredential.findUniqueOrThrow({
    where: {
      userId: userId,
    },
  });

  console.info("Checking access token expiry on user " + userId);

  // If the token has expired
  if (Date.now() > user.tokenExpiry.getTime()) {
    console.info("Token expired on user " + userId);
    console.log("Refreshing token for user " + userId);

    // Perform the refresh
    const result = await handleTokenRefresh(user.refreshToken);

    console.log("Refresh token exchange complete for user " + userId);
    console.info("Writing new token to database for user" + userId);

    // Update the user in the database
    const newUser = await prisma.nkCredential.update({
      where: {
        userId: user.userId,
      },
      data: {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        tokenExpiry: new Date(Date.now() + result.expires_in * 1000),
      },
    });

    console.info("Successfully wrote new token to database for user " + userId);

    // Now return the access token
    return newUser.accessToken;
  } else {
    // Otherwise, the token is good, so return it
    return user.accessToken;
  }
}

/**
 * Method to convert an ISession object (returned by NK) to a session response object to be sent off
 * @param session the ISession to convert
 * @returns a SessionResponse object containing the same data
 */
function iSessionToSessionResponse(
  session: ISingularSessionResponse,
): z.infer<typeof GetSessionResponse> {
  return {
    id: session.id,
    description: session.name,
    locationDescription: session.location,
    totalDistance: session.totalDistanceGps,
    avgDistPerStroke: session.distStrokeGps,
    avgStrokeRate: session.avgStrokeRate,
    avgSpeed: session.avgSpeedGps,
    startTime: new Date(session.startTime),
    endTime: new Date(session.endTime),
    duration: session.elapsedTime,
    strokeCount: session.totalStrokeCount,
    startGpsLat: session.startGpsLat,
    startGpsLon: session.startGpsLon,
    deviceId: session.deviceId,
    intervals:
      session.type == 3
        ? session.intervals.map((interval) => {
            return {
              id: interval.id,
              distance: interval.totalDistanceGps,
              avgDistPerStroke: interval.distStrokeGps,
              avgStrokeRate: interval.avgStrokeRate,
              avgSpeed: interval.avgSpeedGps,
              startTime: new Date(interval.startTime),
              elapsedTime: interval.elapsedTime,
              strokeCount: interval.totalStrokeCount,
              startGpsLat: interval.startGpsLat,
              startGpsLon: interval.startGpsLon,
            };
          })
        : [],
  } satisfies z.infer<typeof GetSessionResponse>;
}

/**
 * Converts an ISessionStroke object (returned by NK) to a GetStrokeResponse object to be sent off
 * @param stroke the ISessionStroke object to convert
 * @returns a GetStrokeResponse object containing the same data
 */
function iSessionStrokeToStrokeResponse(
  stroke: ISingularSessionSingularStrokeResponse,
): z.infer<typeof GetStrokeResponse> {
  return {
    id: stroke.id,
    timestamp: new Date(stroke.timestamp),
    latitude: stroke.latitude,
    longitude: stroke.longitude,
    speed: stroke.gpsInstaSpeed,
    totalDistance: stroke.gpsTotalDistance,
    elapsedTime: stroke.elapsedTime,
    distPerStroke: stroke.gpsDistStroke,
    strokeRate: stroke.strokeRate,
    strokeCount: stroke.strokeCount,
  } satisfies z.infer<typeof GetStrokeResponse>;
}

// Router for NK account data. Assumes to be mounted somewhere that has :id as a path parameter
const router: Router = express.Router();

// Handler to get all sessions associated with this account, based on filters
router.get(
  "/:accountId/data/sessions",
  validateHasId("accountId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    const filters = GetSessionsQueryParams.safeParse(req.query);

    // If the query params are bad, send off an error
    if (!filters.success) {
      res.status(400).send({
        message: fromZodError(filters.error).toString(),
      } satisfies IErrorResponse);
      return;
    }

    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken((req as IRequestWithId)._id),
      filters.data.endTimeMax,
      filters.data.endTimeMin,
    );

    // Now, apply the filters
    if (filters.data.minElapsedTime) {
      sessions = sessions.filter(
        (session) => session.elapsedTime >= filters.data.minElapsedTime!,
      );
    }
    if (filters.data.maxElapsedTime) {
      sessions = sessions.filter(
        (session) => session.elapsedTime <= filters.data.maxElapsedTime!,
      );
    }
    if (filters.data.minTotalDist) {
      sessions = sessions.filter(
        (session) => session.totalDistanceGps >= filters.data.minTotalDist!,
      );
    }
    if (filters.data.maxTotalDist) {
      sessions = sessions.filter(
        (session) => session.totalDistanceGps <= filters.data.maxTotalDist!,
      );
    }
    if (filters.data.minStrokeCount) {
      sessions = sessions.filter(
        (session) => session.totalStrokeCount >= filters.data.minStrokeCount!,
      );
    }
    if (filters.data.maxStrokeCount) {
      sessions = sessions.filter(
        (session) => session.totalStrokeCount <= filters.data.maxStrokeCount!,
      );
    }
    if (filters.data.minAvgDistPerStroke) {
      sessions = sessions.filter(
        (session) => session.distStrokeGps >= filters.data.minAvgDistPerStroke!,
      );
    }
    if (filters.data.maxAvgDistPerStroke) {
      sessions = sessions.filter(
        (session) => session.distStrokeGps <= filters.data.maxAvgDistPerStroke!,
      );
    }
    if (filters.data.minAvgStrokeRate) {
      sessions = sessions.filter(
        (session) => session.avgStrokeRate >= filters.data.minAvgStrokeRate!,
      );
    }
    if (filters.data.maxAvgStrokeRate) {
      sessions = sessions.filter(
        (session) => session.avgStrokeRate <= filters.data.maxAvgStrokeRate!,
      );
    }
    if (filters.data.minAvgSpeed) {
      sessions = sessions.filter(
        (session) => session.avgSpeedGps >= filters.data.minAvgSpeed!,
      );
    }
    if (filters.data.maxAvgSpeed) {
      sessions = sessions.filter(
        (session) => session.avgSpeedGps <= filters.data.maxAvgSpeed!,
      );
    }
    if (filters.data.startTimeMin) {
      sessions = sessions.filter(
        (session) => session.startTime >= filters.data.startTimeMin!.getTime(),
      );
    }
    if (filters.data.startTimeMax) {
      sessions = sessions.filter(
        (session) => session.startTime <= filters.data.startTimeMax!.getTime()!,
      );
    }
    if (filters.data.startGpsLatMin) {
      sessions = sessions.filter(
        (session) => session.startGpsLat >= filters.data.startGpsLatMin!,
      );
    }
    if (filters.data.startGpsLatMax) {
      sessions = sessions.filter(
        (session) => session.startGpsLat <= filters.data.startGpsLatMax!,
      );
    }
    if (filters.data.startGpsLonMin) {
      sessions = sessions.filter(
        (session) => session.startGpsLon >= filters.data.startGpsLonMin!,
      );
    }
    if (filters.data.startGpsLonMax) {
      sessions = sessions.filter(
        (session) => session.startGpsLon <= filters.data.startGpsLonMax!,
      );
    }

    // Finally, send the data back over the wire
    res.status(200).send({
      sessions: sessions.map((session) => iSessionToSessionResponse(session)),
    } satisfies z.infer<typeof GetSessionsResponse>);
  },
);

// Endpoint to get a singular session ID data
router.get(
  "/:accountId/data/sessions/:sessionId",
  validateHasId("accountId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Validate we have a session ID
    if (!req.params.sessionId) {
      res.status(400).send({
        message: "Missing required parameter sessionId",
      } satisfies IErrorResponse);
      return;
    }

    // Parse the session ID as an integer
    let sessionId: number;
    try {
      sessionId = parseInt(req.params.sessionId);
    } catch (error) {
      res.status(400).send({
        message: "Parameter sessionId must be an integer",
      } satisfies IErrorResponse);
      return;
    }

    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken((req as IRequestWithId)._id),
    );

    sessions = sessions.filter((session) => session.id == sessionId);

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      res.sendStatus(404);
      return;
    }

    // Process and send the final session
    res.status(200).send(iSessionToSessionResponse(sessions[0]));
  },
);

router.get(
  "/:accountId/data/sessions/:sessionId/strokes",
  validateHasId("accountId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Validate we have a session ID
    if (!req.params.sessionId) {
      res.status(400).send({
        message: "Missing required parameter sessionId",
      } satisfies IErrorResponse);
      return;
    }

    // Parse the session ID as an integer
    let sessionId: number;
    try {
      sessionId = parseInt(req.params.sessionId);
    } catch (error) {
      res.status(400).send({
        message: "Parameter sessionId must be an integer",
      } satisfies IErrorResponse);
      return;
    }

    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken((req as IRequestWithId)._id),
    );

    sessions = sessions.filter((session) => session.id == sessionId);

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      res.sendStatus(404);
      return;
    }

    // Get the session strokes for the provided session
    const sessionStrokes = await fetchStrokes(
      await getAccessToken((req as IRequestWithId)._id),
      [sessions[0].id],
    );

    // Send the session strokes
    res.status(200).send({
      strokes: sessionStrokes[sessions[0].id].map((stroke) =>
        iSessionStrokeToStrokeResponse(stroke),
      ),
    } satisfies z.infer<typeof GetStrokesResponse>);
  },
);

// Endpoint to get the details on a singular stroke
router.get(
  "/:accountId/data/sessions/:sessionId/strokes/:strokeId",
  validateHasId("accountId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Validate we have a session ID
    if (!req.params.sessionId) {
      res.status(400).send({
        message: "Missing required parameter sessionId",
      } satisfies IErrorResponse);
      return;
    }

    // Parse the session ID as an integer
    let sessionId: number;
    try {
      sessionId = parseInt(req.params.sessionId);
    } catch (error) {
      res.status(400).send({
        message: "Parameter sessionId must be an integer",
      } satisfies IErrorResponse);
      return;
    }

    // Validate we have a session ID
    if (!req.params.strokeId) {
      res.status(400).send({
        message: "Missing required parameter strokeId",
      } satisfies IErrorResponse);
      return;
    }

    // Parse the session ID as an integer
    let strokeId: number;
    try {
      strokeId = parseInt(req.params.sessionId);
    } catch (error) {
      res.status(400).send({
        message: "Parameter strokeId must be an integer",
      } satisfies IErrorResponse);
      return;
    }

    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken((req as IRequestWithId)._id),
    );

    sessions = sessions.filter((session) => session.id == sessionId);

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      res.sendStatus(404);
      return;
    }

    // Get the session strokes for the provided session
    const sessionStrokes = (
      await fetchStrokes(await getAccessToken((req as IRequestWithId)._id), [
        sessions[0].id,
      ])
    )[sessions[0].id].filter((stroke) => stroke.id == strokeId);

    // If the provided stroke ID doesn't exist, send 404
    if (sessionStrokes.length == 0) {
      res.sendStatus(404);
      return;
    }

    // Send off the stroke now that we have it
    res.status(200).send(iSessionStrokeToStrokeResponse(sessionStrokes[0]));
  },
);

export default router;
