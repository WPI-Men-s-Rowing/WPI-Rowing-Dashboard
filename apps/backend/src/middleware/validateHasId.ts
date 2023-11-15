import { IErrorResponse } from "common";
import { NextFunction, Request, Response } from "express";

/**
 * Creates a middleware that validates the provided request contains
 * a path component with the provided ID. Additionally, modifies the request
 * object to contain an _id parameter with the parsed ID
 * @param idPathComponentName the path component that contains the ID
 */
export function validateHasId(idPathComponentName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate the ID is there
    if (req.params[idPathComponentName] == undefined) {
      res.status(400).send({
        message: "Missing required parameter ID",
      } satisfies IErrorResponse);
      return;
    }

    // Now parse the ID to ensure it is a number
    let id: number;
    try {
      id = parseInt(req.params[idPathComponentName]);
    } catch (error) {
      res.status(400).send("Invalid account ID (account IDs must be integers)");
      return;
    }

    // Add the ID param now that we've parsed it
    (req as IRequestWithId)._id = id;

    // If we got this far, we're good, and can pass to the desired element
    next();
  };
}

/**
 * Interface that allows
 */
export interface IRequestWithId extends Request {
  _id: number;
}
