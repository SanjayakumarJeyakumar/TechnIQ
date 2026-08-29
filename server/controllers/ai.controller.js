import { getLearningGuidance } from '../services/gemini.service.js'

export async function postGuide(req, res, next) {
  try {
    const { skills, prompt } = req.body

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Please enter a question for the AI Guide.' })
    }
    if (prompt.length > 1000) {
      return res.status(400).json({ error: 'That question is a bit long — try trimming it down.' })
    }

    const guidance = await getLearningGuidance({
      skills: Array.isArray(skills) ? skills : [],
      prompt: prompt.trim(),
    })

    res.json({ guidance })
  } catch (err) {
    err.status = err.status || 502
    if (!err.message?.includes('TechnIQ')) {
      err.message = 'The AI Guide is unavailable right now. Please try again in a moment.'
    }
    next(err)
  }
}
