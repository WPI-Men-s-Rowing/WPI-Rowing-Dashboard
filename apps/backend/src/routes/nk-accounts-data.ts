import {
  GetDevicesResponse,
  GetStrokesResponse,
  nkAccountsData
} from "api-schema";
import {device as APIDevice, session as APISession, stroke as APIStroke} from "api-schema/components";
import { prisma } from "database";
import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { validateHasId } from "../middleware/validateHasId.ts";
import {
  IDevicesByIdResponse,
  getAllDevices,
  getDevice,
} from "../nk/devices.ts";
import { handleTokenRefresh } from "../nk/oauth.ts";
import {
  ISingularSessionResponse,
  ISingularSessionSingularStrokeResponse,
  fetchSessions,
  fetchStrokes,
} from "../nk/sessions.ts";
import { zodiosRouter } from "@zodios/express";
import asyncify from "express-asyncify";

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
): z.infer<typeof APISession> {
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
  };
}

/**
 * Converts an ISessionStroke object (returned by NK) to a GetStrokeResponse object to be sent off
 * @param stroke the ISessionStroke object to convert
 * @returns a GetStrokeResponse object containing the same data
 */
function iSessionStrokeToStrokeResponse(
  stroke: ISingularSessionSingularStrokeResponse,
): z.infer<typeof APIStroke> {
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
  };
}

// TODO:
// fix this mess of a route
// add openapi
// see if we can get better error typing working?

/**
 * Function to convert an IDeviceByIdResponse object (from NK) to a GetDeviceResponse object
 * @param device the IDeviceByResponse object to convert
 * @returns a GetDeviceResponse object containing the same data
 */
function iDeviceToDeviceResponse(
  device: IDevicesByIdResponse,
): z.infer<typeof APIDevice> {
  let deviceType: z.infer<typeof APIDevice.shape.type>;
  if (device.type == 1) {
    deviceType = APIDevice.shape.type.enum.SpeedCoach;
  } else if (device.type == 2) {
    deviceType = APIDevice.shape.type.enum.CoxBox;
  } else {
    throw new Error("Invalid NK Device Type");
  }

  return {
    id: device.id,
    type: deviceType,
    model: device.model,
    name: device.name,
    firmwareVersion: device.firmwareVersion,
    hardwareVersion: device.hardwareVersion,
    serialNumber: device.serialNumber,
    manufacturerName: device.manufacturerName,
    profileVersion: device.manufacturerName,
  };
}

// Router for NK account data. Assumes to be mounted somewhere that has :id as a path parameter
const router = zodiosRouter(nkAccountsData, {
  router: asyncify(Router())
});

// Handler to get all sessions associated with this account, based on filters
router.get(
  "/:accountId/data/sessions",
  // Using asyncify, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req, res): Promise<void> {
    if (!(await prisma.nkCredential.findUnique({
      where: {
        userId: req.params.accountId
      }
    }))) {
      res.status(404).send({message: "Invalid account ID"});
      return;
    }

    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken(req.params.accountId),
      req.query.maxEndTime,
      req.query.minEndTime,
    );

    // Now, apply the filters
    if (req.query.minElapsedTime) {
      sessions = sessions.filter(
        (session) => session.elapsedTime >= req.query.minElapsedTime!,
      );
    }
    if (req.query.maxElapsedTime) {
      sessions = sessions.filter(
        (session) => session.elapsedTime <= req.query.maxElapsedTime!,
      );
    }
    if (req.query.minTotalDist) {
      sessions = sessions.filter(
        (session) => session.totalDistanceGps >= req.query.minTotalDist!,
      );
    }
    if (req.query.maxTotalDist) {
      sessions = sessions.filter(
        (session) => session.totalDistanceGps <= req.query.maxTotalDist!,
      );
    }
    if (req.query.minStrokeCount) {
      sessions = sessions.filter(
        (session) => session.totalStrokeCount >= req.query.minStrokeCount!,
      );
    }
    if (req.query.maxStrokeCount) {
      sessions = sessions.filter(
        (session) => session.totalStrokeCount <= req.query.maxStrokeCount!,
      );
    }
    if (req.query.minAvgDistPerStroke) {
      sessions = sessions.filter(
        (session) => session.distStrokeGps >= req.query.minAvgDistPerStroke!,
      );
    }
    if (req.query.maxAvgDistPerStroke) {
      sessions = sessions.filter(
        (session) => session.distStrokeGps <= req.query.maxAvgDistPerStroke!,
      );
    }
    if (req.query.minAvgStrokeRate) {
      sessions = sessions.filter(
        (session) => session.avgStrokeRate >= req.query.minAvgStrokeRate!,
      );
    }
    if (req.query.maxAvgStrokeRate) {
      sessions = sessions.filter(
        (session) => session.avgStrokeRate <= req.query.maxAvgStrokeRate!,
      );
    }
    if (req.query.minAvgSpeed) {
      sessions = sessions.filter(
        (session) => session.avgSpeedGps >= req.query.minAvgSpeed!,
      );
    }
    if (req.query.maxAvgSpeed) {
      sessions = sessions.filter(
        (session) => session.avgSpeedGps <= req.query.maxAvgSpeed!,
      );
    }
    if (req.query.minStartTime) {
      sessions = sessions.filter(
        (session) => session.startTime >= req.query.minStartTime!.getTime(),
      );
    }
    if (req.query.maxStartTime) {
      sessions = sessions.filter(
        (session) => session.startTime <= req.query.maxStartTime!.getTime()!,
      );
    }
    if (req.query.minStartGpsLat) {
      sessions = sessions.filter(
        (session) => session.startGpsLat >= req.query.minStartGpsLat!,
      );
    }
    if (req.query.maxStartGpsLat) {
      sessions = sessions.filter(
        (session) => session.startGpsLat <= req.query.maxStartGpsLat!,
      );
    }
    if (req.query.minStartGpsLon) {
      sessions = sessions.filter(
        (session) => session.startGpsLon >= req.query.minStartGpsLon!,
      );
    }
    if (req.query.maxStartGpsLon) {
      sessions = sessions.filter(
        (session) => session.startGpsLon <= req.query.maxStartGpsLon!,
      );
    }

    // Finally, send the data back over the wire
    res.status(200).send({
      sessions: sessions.map((session) => iSessionToSessionResponse(session)),
    });
  },
);

// Endpoint to get a singular session ID data
router.get(
  "/:accountId/data/sessions/:sessionId",
  // Using asyncify, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req, res): Promise<void> {
    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken(req.params.accountId),
    );

    sessions = sessions.filter(
      (session) => session.id == req.params.sessionId,
    );

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      res.status(404).send({
        message: "Could not find session with ID " + req.params.sessionId
      });
      return;
    }

    // Process and send the final session
    res.status(200).send(iSessionToSessionResponse(sessions[0]));
  },
);

router.get(
  "/:accountId/data/sessions/:sessionId/strokes",
  validateHasId("accountId"),
  validateHasId("sessionId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken(parseInt(req.params.accountId)),
    );

    sessions = sessions.filter(
      (session) => session.id == parseInt(req.params.sessionId),
    );

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      res.sendStatus(404);
      return;
    }

    // Get the session strokes for the provided session
    const sessionStrokes = await fetchStrokes(
      await getAccessToken(parseInt(req.params.accountId)),
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
  validateHasId("sessionId"),
  validateHasId("strokeId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken(parseInt(req.params.accountId)),
    );

    sessions = sessions.filter(
      (session) => session.id == parseInt(req.params.sessionId),
    );

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      res.sendStatus(404);
      return;
    }

    // Get the session strokes for the provided session
    const sessionStrokes = (
      await fetchStrokes(await getAccessToken(parseInt(req.params.accountId)), [
        sessions[0].id,
      ])
    )[sessions[0].id].filter(
      (stroke) => stroke.id == parseInt(req.params.strokeId),
    );

    // If the provided stroke ID doesn't exist, send 404
    if (sessionStrokes.length == 0) {
      res.sendStatus(404);
      return;
    }

    // Send off the stroke now that we have it
    res.status(200).send(iSessionStrokeToStrokeResponse(sessionStrokes[0]));
  },
);

// Endpoint to get all devices on the account
router.get(
  "/:accountId/data/devices",
  validateHasId("accountId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Get all the devices
    const devices = await getAllDevices(
      await getAccessToken(parseInt(req.params.accountId)),
    );

    // Send the devices off
    res.status(200).send({
      devices: devices.map((device) => iDeviceToDeviceResponse(device)),
    } satisfies z.infer<typeof GetDevicesResponse>);
  },
);

// Endpoint to get all devices on the account
router.get(
  "/:accountId/data/devices/:deviceId",
  validateHasId("accountId"),
  validateHasId("deviceId"),
  // Using express 5 with express 4 types, safe to ignore
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  async function (req: Request, res: Response): Promise<void> {
    // Get all the devices
    const device = await getDevice(
      await getAccessToken(parseInt(req.params.accountId)),
      parseInt(req.params.deviceId),
    );

    // Send the devices off
    res.status(200).send(iDeviceToDeviceResponse(device));
  },
);

// This is the only way to make typescript happy and let this export :)
export default router as unknown as Router;
