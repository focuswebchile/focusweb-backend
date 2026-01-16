import type { Request, Response, NextFunction } from "express"
import { supabaseAdmin } from "../services/supabase"

export async function requireSiteAccess(req: Request, res: Response, next: NextFunction) {
  const siteId = req.params.siteId
  const userId = req.user?.sub

  if (!siteId || !userId) {
    return res.status(400).json({ error: "Missing siteId or user" })
  }

  const { data, error } = await supabaseAdmin
    .from("memberships")
    .select("id, role")
    .eq("site_id", siteId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return res.status(403).json({ error: "No access to this site" })
  }

  return next()
}
