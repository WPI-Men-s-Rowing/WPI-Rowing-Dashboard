import { ServerInferResponseBody } from "@ts-rest/core";
import { initServer } from "@ts-rest/fastify";
import contract from "api-schema";
import { prisma } from "database";
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

// Create a server to use with the data
const server = initServer();

export default server.router(contract.nkAccounts.data, {
  getSessions: async ({ query, params }) => {
    // Validate the target account
    if (
      !(await prisma.nkCredential.findUnique({
        where: {
          userId: params.accountId,
        },
      }))
    ) {
      return {
        status: 404,
        body: {
          key: "accountId",
        },
      };
    }

    // Get the sessions
    let sessions = await fetchSessions(
      await getAccessToken(params.accountId),
      query.maxEndTime,
      query.minEndTime,
    );

    // Now, apply the filters
    if (query.minElapsedTime) {
      sessions = sessions.filter(
        (session) => session.elapsedTime >= query.minElapsedTime!,
      );
    }
    if (query.maxElapsedTime) {
      sessions = sessions.filter(
        (session) => session.elapsedTime <= query.maxElapsedTime!,
      );
    }
    if (query.minTotalDist) {
      sessions = sessions.filter(
        (session) => session.totalDistanceGps >= query.minTotalDist!,
      );
    }
    if (query.maxTotalDist) {
      sessions = sessions.filter(
        (session) => session.totalDistanceGps <= query.maxTotalDist!,
      );
    }
    if (query.minStrokeCount) {
      sessions = sessions.filter(
        (session) => session.totalStrokeCount >= query.minStrokeCount!,
      );
    }
    if (query.maxStrokeCount) {
      sessions = sessions.filter(
        (session) => session.totalStrokeCount <= query.maxStrokeCount!,
      );
    }
    if (query.minAvgDistPerStroke) {
      sessions = sessions.filter(
        (session) => session.distStrokeGps >= query.minAvgDistPerStroke!,
      );
    }
    if (query.maxAvgDistPerStroke) {
      sessions = sessions.filter(
        (session) => session.distStrokeGps <= query.maxAvgDistPerStroke!,
      );
    }
    if (query.minAvgStrokeRate) {
      sessions = sessions.filter(
        (session) => session.avgStrokeRate >= query.minAvgStrokeRate!,
      );
    }
    if (query.maxAvgStrokeRate) {
      sessions = sessions.filter(
        (session) => session.avgStrokeRate <= query.maxAvgStrokeRate!,
      );
    }
    if (query.minAvgSpeed) {
      sessions = sessions.filter(
        (session) => session.avgSpeedGps >= query.minAvgSpeed!,
      );
    }
    if (query.maxAvgSpeed) {
      sessions = sessions.filter(
        (session) => session.avgSpeedGps <= query.maxAvgSpeed!,
      );
    }
    if (query.minStartTime) {
      sessions = sessions.filter(
        (session) => session.startTime >= query.minStartTime!.getTime(),
      );
    }
    if (query.maxStartTime) {
      sessions = sessions.filter(
        (session) => session.startTime <= query.maxStartTime!.getTime()!,
      );
    }
    if (query.minStartGpsLat) {
      sessions = sessions.filter(
        (session) => session.startGpsLat >= query.minStartGpsLat!,
      );
    }
    if (query.maxStartGpsLat) {
      sessions = sessions.filter(
        (session) => session.startGpsLat <= query.maxStartGpsLat!,
      );
    }
    if (query.minStartGpsLon) {
      sessions = sessions.filter(
        (session) => session.startGpsLon >= query.minStartGpsLon!,
      );
    }
    if (query.maxStartGpsLon) {
      sessions = sessions.filter(
        (session) => session.startGpsLon <= query.maxStartGpsLon!,
      );
    }

    // Finally, send the data back over the wire
    return {
      status: 200,
      body: {
        sessions: sessions.map((session) => iSessionToSessionResponse(session)),
      },
    };
  },
  getSession: async ({ params }) => {
    // Validate the target account
    if (
      !(await prisma.nkCredential.findUnique({
        where: {
          userId: params.accountId,
        },
      }))
    ) {
      return {
        status: 404,
        body: {
          key: "accountId",
        },
      };
    }

    // Get the sessions
    let sessions = await fetchSessions(await getAccessToken(params.accountId));

    sessions = sessions.filter((session) => session.id == params.sessionId);

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      return {
        status: 404,
        body: {
          key: "sessionId",
        },
      };
    }

    // Process and send the final session
    return {
      status: 200,
      body: iSessionToSessionResponse(sessions[0]),
    };
  },
  getSessionStrokes: async ({ params }) => {
    // Validate the target account
    if (
      !(await prisma.nkCredential.findUnique({
        where: {
          userId: params.accountId,
        },
      }))
    ) {
      return {
        status: 404,
        body: {
          key: "accountId",
        },
      };
    }

    // Get the sessions
    let sessions = await fetchSessions(await getAccessToken(params.accountId));

    sessions = sessions.filter((session) => session.id == params.sessionId);

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      return {
        status: 404,
        body: {
          key: "sessionId",
        },
      };
    }

    // Get the session strokes for the provided session
    const sessionStrokes = await fetchStrokes(
      await getAccessToken(params.accountId),
      [sessions[0].id],
    );

    // Send the session strokes
    return {
      status: 200,
      body: {
        strokes: sessionStrokes[sessions[0].id].map((stroke) =>
          iSessionStrokeToStrokeResponse(stroke),
        ),
      },
    };
  },
  getSessionStroke: async ({ params }) => {
    // Validate the users account
    if (
      !(await prisma.nkCredential.findUnique({
        where: {
          userId: params.accountId,
        },
      }))
    ) {
      return {
        status: 404,
        body: {
          key: "accountId",
        },
      };
    }

    // Get the sessions
    let sessions = await fetchSessions(await getAccessToken(params.accountId));

    sessions = sessions.filter((session) => session.id == params.sessionId);

    // If we didn't find a session with that ID, just 404 it
    if (sessions.length == 0) {
      return {
        status: 404,
        body: {
          key: "sessionId",
        },
      };
    }

    // Get the session strokes for the provided session
    const sessionStrokes = (
      await fetchStrokes(await getAccessToken(params.accountId), [
        sessions[0].id,
      ])
    )[sessions[0].id].filter((stroke) => stroke.id == params.strokeId);

    // If the provided stroke ID doesn't exist, send 404
    if (sessionStrokes.length == 0) {
      return {
        status: 404,
        body: {
          key: "strokeId",
        },
      };
    }

    // Send off the stroke now that we have it
    return {
      status: 200,
      body: iSessionStrokeToStrokeResponse(sessionStrokes[0]),
    };
  },
  getDevices: async ({ params }) => {
    // Validate the target account
    if (
      !(await prisma.nkCredential.findUnique({
        where: {
          userId: params.accountId,
        },
      }))
    ) {
      return {
        status: 404,
        body: {
          key: "accountId",
        },
      };
    }

    // Get all the devices
    const devices = await getAllDevices(await getAccessToken(params.accountId));

    // Send the devices off
    return {
      status: 200,
      body: {
        devices: devices.map((device) => iDeviceToDeviceResponse(device)),
      },
    };
  },
  getDevice: async ({ params }) => {
    // Get all the devices
    const device = await getDevice(
      await getAccessToken(params.accountId),
      params.deviceId,
    );

    // Send the devices off
    return { status: 200, body: iDeviceToDeviceResponse(device) };
  },
});

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
): ServerInferResponseBody<typeof contract.nkAccounts.data.getSession, 200> {
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
              duration: interval.elapsedTime,
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
): ServerInferResponseBody<
  typeof contract.nkAccounts.data.getSessionStroke,
  200
> {
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

/**
 * Function to convert an IDeviceByIdResponse object (from NK) to a GetDeviceResponse object
 * @param device the IDeviceByResponse object to convert
 * @returns a GetDeviceResponse object containing the same data
 */
function iDeviceToDeviceResponse(
  device: IDevicesByIdResponse,
): ServerInferResponseBody<typeof contract.nkAccounts.data.getDevice, 200> {
  let deviceType: ServerInferResponseBody<
    typeof contract.nkAccounts.data.getDevice,
    200
  >["type"];
  if (device.type == 1) {
    deviceType =
      contract.nkAccounts.data.getDevice.responses["200"].shape.type.enum
        .SpeedCoach;
  } else if (device.type == 2) {
    deviceType =
      contract.nkAccounts.data.getDevice.responses["200"].shape.type.enum
        .SpeedCoach;
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
