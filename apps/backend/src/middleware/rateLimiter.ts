import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Create limiter
const rateLimiter = new RateLimiterMemory({
  keyPrefix: "middleware",
  points: 10, // 10 requests
  duration: 1, // per 1 second by IP
});

// Export a middleware that uses the rate limiter. Automatically reject requests with no IP
export default () => (req: Request, res: Response, next: NextFunction) => {
  if (req.ip) {
    rateLimiter
      .consume(req.ip)
      .then(() => {
        next();
      })
      .catch(() => {
        res.sendStatus(429);
      });
  } else {
    res.sendStatus(429);
  }
};
