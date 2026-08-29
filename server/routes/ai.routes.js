import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { aiGuideRateLimiter } from '../middleware/rateLimiter.middleware.js'
import { postGuide } from '../controllers/ai.controller.js'

const router = Router()

// POST /api/ai/guide  { skills: string[], prompt: string }
// Protected by Supabase JWT validation + 15 req/15 min rate limiter
router.post('/guide', requireAuth, aiGuideRateLimiter, postGuide)

export default router
