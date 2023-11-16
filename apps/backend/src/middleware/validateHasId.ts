import { IErrorResponse } from "common";
import { NextFunction, Request, Response } from "express";

/**
 * Creates a middleware that validates the provided request contains
 * a path component with the provided ID.
 * @param idPathComponentName the path component that contains the ID
 */
export function validateHasId(idPathComponentName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate the ID is there
    if (req.params[idPathComponentName] == undefined) {
      res.status(400).send({
        message: "Missing required parameter " + idPathComponentName,
      } satisfies IErrorResponse);
      return;
    }

    try {
      parseInt(req.params[idPathComponentName]);
    } catch (error) {
      res
        .status(400)
        .send(
          "Required parameter " + idPathComponentName + " must be an integer",
        );
      return;
    }

    // If we got this far, we're good, and can pass to the desired element
    next();
  };
}
