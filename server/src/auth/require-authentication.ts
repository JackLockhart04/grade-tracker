import type { RequestHandler } from "express";

export const requireAuthentication: RequestHandler = (
  request,
  response,
  next,
) => {
  if (!request.session.userId) {
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  response.locals.userId = request.session.userId;
  next();
};
