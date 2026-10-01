import type { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }
  req.userId = userId;
  next();
}
