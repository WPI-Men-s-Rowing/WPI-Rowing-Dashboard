import { IErrorResponse } from "common";
import { NextFunction, Request, Response } from "express";

/**
 * Creates a middleware that validates the provided
 * @param idPathComponentName
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
    try {
      parseInt(req.params[idPathComponentName]);
    } catch (error) {
      res.status(400).send("Invalid account ID (account IDs must be integers)");
      return;
    }

    // If we got this far, we're good, and can pass to the desired element
    next();
  };
}
