import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"

type JwtPayload = {
  sub: string
  email?: string
}

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" })
  }

  const token = authHeader.replace("Bearer ", "")
  try {
    const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as JwtPayload
    req.user = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" })
  }
}
