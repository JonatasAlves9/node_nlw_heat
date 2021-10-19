import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

interface IPayload {
  sub: string;
}

export function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authToken = request.headers.authorization;

  if (!authToken) {
    return response.status(401).json({ errorCode: "Token invalid" });
  }

  // Bearer 54a5d5545a4d54d5s4d54sd5s4d5s4d5
  // [0] Bearer
  // [1] 54a5d5545a4d54d5s4d54sd5s4d5s4d5

  const [, token] = authToken.split(" ");

  try {
    const { sub } = verify(token, process.env.JWT_SECRET) as IPayload;

    request.user_id = sub;

    return next();
  } catch (error) {
    return response.status(401).json({ errorCode: "Token expired" });
  }
}
