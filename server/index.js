import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import healthRoutes from './routes/health.routes.js'
import aiRoutes from './routes/ai.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js'

const app = express()
const PORT = process.env.PORT || 4000

// Production CORS allowlist configuration
const rawOrigins = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like health checks or server-to-server)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true)
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`))
    },
    credentials: true,
  })
)

app.use(express.json({ limit: '100kb' }))

// Hardened Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

app.use('/api/health', healthRoutes)
app.use('/api/ai', aiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`TechnIQ API listening on http://localhost:${PORT}`)
})
