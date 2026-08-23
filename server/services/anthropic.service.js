import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are TechnIQ's AI Guide: a friendly, encouraging learning-path
assistant for college students on a peer skill-sharing platform. You are
NOT an authoritative academic advisor — keep recommendations practical and
beginner-friendly, not exhaustive.

Given a student's current skills and their stated goal, respond with:
1. A short (1-2 sentence) encouraging framing of where they're starting from.
2. An ordered list of 4-6 next skills to learn, each with a one-line reason.
3. One concrete beginner project idea that ties the recommended skills together.

Keep the whole response under 200 words. Do not pad with disclaimers beyond
noting once, briefly, that this is a starting point, not a fixed curriculum.`

/**
 * Calls Claude with the student's known skills + their free-text goal and
 * returns the raw text response. Kept deliberately simple for the scaffold;
 * Phase 8 will parse this into the structured { steps: [...] } shape the
 * frontend renders as a step list.
 */
export async function getLearningGuidance({ skills, prompt }) {
  const skillsList = skills?.length ? skills.join(', ') : 'no skills listed yet'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `My current skills: ${skillsList}\n\nMy question: ${prompt}`,
      },
    ],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  return textBlock?.text ?? ''
}
