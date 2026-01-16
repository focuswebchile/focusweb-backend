import { Router } from "express"
import { z } from "zod"
import { supabaseAdmin } from "../services/supabase"

const router = Router()

const magicLinkSchema = z.object({
  email: z.string().email(),
})

router.post("/auth/magic-link", async (req, res) => {
  const parsed = magicLinkSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email" })
  }

  const { error } = await supabaseAdmin.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) {
    return res.status(500).json({ error: "Could not send magic link" })
  }

  return res.json({ ok: true })
})

export default router
