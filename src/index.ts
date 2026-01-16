import express from "express"
import cors from "cors"
import { env } from "./config/env"
import authRoutes from "./routes/auth"
import siteRoutes from "./routes/sites"

const app = express()

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error("Not allowed by CORS"))
    },
  }),
)
app.use(express.json({ limit: "1mb" }))

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.use("/api", authRoutes)
app.use("/api", siteRoutes)

app.listen(env.PORT, () => {
  console.log(`Backend running on http://localhost:${env.PORT}`)
})
