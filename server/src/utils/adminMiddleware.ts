import { NextFunction, Request, Response } from "express";
import { handler } from "./shows.js";
import { CLIENT_ERROR } from "./httpCodes.js";
import { getEnvWithThrow } from "./serverInit.js";
import jwt from "jsonwebtoken"

const HEADER_PREFIX_LENGTH = "Bearer".length

const ADMIN_KEY = getEnvWithThrow("ADMIN_KEY")

const verifyAdmin = (req: Request, res: Response, next: NextFunction) => handler<Response | void>(res, async () => {
  const header = req.headers["authorization"]

  if (!header) return res.status(CLIENT_ERROR.UNAUTHORIZED).json("Authorisation header missing")

  const authToken = header.slice(HEADER_PREFIX_LENGTH)

  jwt.verify(authToken, ADMIN_KEY)
})
