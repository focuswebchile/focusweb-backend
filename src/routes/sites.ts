import { Router } from "express"
import { z } from "zod"
import { requireAuth } from "../middleware/require-auth"
import { requireSiteAccess } from "../middleware/require-site-access"
import { supabaseAdmin } from "../services/supabase"

const router = Router()

const settingsSchema = z.object({
  colors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    })
    .optional(),
  typography: z
    .object({
      fontFamily: z.string().optional(),
      baseSize: z.string().optional(),
      lineHeight: z.string().optional(),
    })
    .optional(),
  content: z
    .object({
      hero: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          cta: z
            .object({
              primary_text: z.string().optional(),
              primary_url: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      services: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
          items: z
            .object({
              service_1: z
                .object({
                  title: z.string().optional(),
                  description: z.string().optional(),
                })
                .optional(),
              service_2: z
                .object({
                  title: z.string().optional(),
                  description: z.string().optional(),
                })
                .optional(),
              service_3: z
                .object({
                  title: z.string().optional(),
                  description: z.string().optional(),
                })
                .optional(),
            })
            .optional(),
        })
        .optional(),
      contact: z
        .object({
          title: z.string().optional(),
          subtitle: z.string().optional(),
        })
        .optional(),
      faq: z
        .object({
          question_1: z.string().optional(),
          answer_1: z.string().optional(),
          question_2: z.string().optional(),
          answer_2: z.string().optional(),
          question_3: z.string().optional(),
          answer_3: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  toggles: z
    .object({
      showServices: z.boolean().optional(),
      showTestimonials: z.boolean().optional(),
      showFAQ: z.boolean().optional(),
      showProcess: z.boolean().optional(),
      showContact: z.boolean().optional(),
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
