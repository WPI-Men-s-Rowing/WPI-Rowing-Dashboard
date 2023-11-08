import { IEvenRequest, IEvenResponse } from "common";
import express, { Request, Response, Router } from "express";

const router: Router = express.Router();

// Whenever a POST request is made, parse the number, and return whether it is even
router.post("/is-even", function (req: Request, res: Response): void {
  const data = req.body as IEvenRequest;

  // Create an even response, based on the parsed even request
  if ((req.body as IEvenRequest).number !== undefined) {
    res.send({
      isEven: data.number % 2 === 0,
    } satisfies IEvenResponse);
  } else {
    res.sendStatus(400); // Send an error status if this was invalid
  }
});

export default router;
