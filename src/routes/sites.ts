import { Router } from "express"
import { z } from "zod"
import { requireAuth } from "../middleware/require-auth"
import { requireSiteAccess } from "../middleware/require-site-access"
import { supabaseAdmin } from "../services/supabase"

const router = Router()

const settingsSchema = z.object({
  colors: z
    .object({
      primary: z.string().min(1),
      secondary: z.string().min(1),
      background: z.string().min(1),
      text: z.string().min(1),
    })
    .optional(),
  typography: z
    .object({
      fontFamily: z.string().min(1),
      baseSize: z.string().min(1),
      lineHeight: z.string().min(1),
    })
    .optional(),
  content: z
    .object({
      hero_title: z.string().min(1),
      hero_subtitle: z.string().min(1),
      primary_cta_text: z.string().min(1),
      primary_cta_url: z.string().url(),
    })
    .optional(),
  toggles: z
    .object({
      showTestimonials: z.boolean(),
      showFAQ: z.boolean(),
      showProcess: z.boolean(),
    })
    .optional(),
})

router.get("/sites/:slug/settings", async (req, res) => {
  const { slug } = req.params

  const { data: site, error: siteError } = await supabaseAdmin
    .from("sites")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle()

  if (siteError || !site) {
    return res.status(404).json({ error: "Site not found" })
  }

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("site_settings")
    .select("settings")
    .eq("site_id", site.id)
    .maybeSingle()

  if (settingsError || !settings) {
    return res.status(404).json({ error: "Settings not found" })
  }

  return res.json({ site, settings: settings.settings })
})

router.get("/me/sites", requireAuth, async (req, res) => {
  const userId = req.user?.sub

  const { data, error } = await supabaseAdmin
    .from("memberships")
    .select("site:sites(id, name, slug)")
    .eq("user_id", userId)

  if (error) {
    return res.status(500).json({ error: "Could not load sites" })
  }

  return res.json({ sites: data?.map((row) => row.site) ?? [] })
})

router.patch("/sites/:siteId/settings", requireAuth, requireSiteAccess, async (req, res) => {
  const { siteId } = req.params

  const parsed = settingsSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid settings payload" })
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("site_settings")
    .select("settings")
    .eq("site_id", siteId)
    .maybeSingle()

  if (existingError || !existing) {
    return res.status(404).json({ error: "Settings not found" })
  }

  const mergedSettings = { ...existing.settings, ...parsed.data }

  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .update({ settings: mergedSettings, updated_at: new Date().toISOString() })
    .eq("site_id", siteId)
    .select("settings")
    .maybeSingle()

  if (error || !data) {
    return res.status(500).json({ error: "Could not update settings" })
  }

  return res.json({ settings: data.settings })
})

export default router
