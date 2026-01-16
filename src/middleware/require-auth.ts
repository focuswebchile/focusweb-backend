import type { Request, Response, NextFunction } from "express"
import { supabaseAdmin } from "../services/supabase"

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
  supabaseAdmin.auth.getUser(token).then(({ data, error }) => {
    if (error || !data?.user) {
      console.error("Auth token error:", error?.message)
      return res.status(401).json({ error: "Invalid token" })
    }
    req.user = { sub: data.user.id, email: data.user.email ?? undefined } satisfies JwtPayload
    return next()
  })
}
