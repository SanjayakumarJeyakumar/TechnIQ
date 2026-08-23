import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import healthRoutes from './routes/health.routes.js'
import aiRoutes from './routes/ai.routes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))

app.use('/api/health', healthRoutes)
app.use('/api/ai', aiRoutes)
// Future: /api/search, /api/requests, /api/messages, /api/notifications
// (only if/when logic outgrows what Supabase RLS + RPC can express directly
// — see architecture doc §4 for why most CRUD skips this backend entirely)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`TechnIQ API listening on http://localhost:${PORT}`)
})
