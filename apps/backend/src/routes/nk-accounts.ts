import axios, { AxiosResponse } from "axios";
import { addAuthCodeRequest } from "common";
import express, { Request, Response, Router } from "express";
import { URLSearchParams } from "url";

const router: Router = express.Router();

// Since we're using Express 4 types with Express 5 this happens :(
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post(
  "/auth-codes",
  async function (req: Request, res: Response): Promise<void> {
    let request: { code: string }; // Request

    try {
      // Validate the input
      request = addAuthCodeRequest.parse(req.body);
    } catch (error) {
      res.status(400).send("Invalid request body");
      return;
    }

    // TODO: fix seeding (not sure how to do this...)

    let result: AxiosResponse<unknown, unknown>;

    // Now make the authorization request, putting hte code and grant in the URL, and the auth in the header
    try {
      result = await axios.post(
        "https://oauth-logbook.nksports.com/oauth/token?" +
          new URLSearchParams({
            code: request.code,
            grant_type: "authorization_code",
            redirect_uri: process.env.NK_REDIRECT_URI!,
          }).toString(),
        {},
        {
          headers: {
            Authorization: `Basic ${btoa(
              `${process.env.NK_CLIENT_ID!}:${process.env.NK_CLIENT_SECRET!}`,
            )}`,
          },
        },
      );
    } catch (error) {
      res.status(400).send("Invalid authorization code");
      return;
    }

    console.log(result);
    // TODO: Cache result in DB as appropriate
    // TODO: Have client call this route
    // TODO: Bind this route in app.ts
  },
);

export default router;
