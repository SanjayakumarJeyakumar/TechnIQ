import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { postGuide } from '../controllers/ai.controller.js'

const router = Router()

// POST /api/ai/guide  { skills: string[], prompt: string }
router.post('/guide', requireAuth, postGuide)

export default router
