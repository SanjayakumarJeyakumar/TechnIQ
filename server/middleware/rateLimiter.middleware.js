/**
 * In-memory sliding-window rate limiter for the Gemini AI Guide.
 * Enforces a strict quota of 15 requests per 15 minutes per authenticated user.
 */

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 15

// Map: userId -> Array of timestamp numbers
const userRequestLog = new Map()

// Periodic garbage collection every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [userId, timestamps] of userRequestLog.entries()) {
    const validTimestamps = timestamps.filter((t) => now - t < WINDOW_MS)
    if (validTimestamps.length === 0) {
      userRequestLog.delete(userId)
    } else {
      userRequestLog.set(userId, validTimestamps)
    }
  }
}, 10 * 60 * 1000)

export function aiGuideRateLimiter(req, res, next) {
  const userId = req.user?.id || req.ip || 'anonymous'
  const now = Date.now()

  const timestamps = userRequestLog.get(userId) || []
  const windowStart = now - WINDOW_MS

  // Keep only timestamps within the current sliding window
  const activeTimestamps = timestamps.filter((t) => t > windowStart)

  if (activeTimestamps.length >= MAX_REQUESTS) {
    const oldestTimestamp = activeTimestamps[0]
    const resetTimeSeconds = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000)

    res.setHeader('Retry-After', resetTimeSeconds)
    return res.status(429).json({
      error: "You're sending requests too quickly. Please try again in a few minutes.",
      retryAfterSeconds: resetTimeSeconds,
    })
  }

  activeTimestamps.push(now)
  userRequestLog.set(userId, activeTimestamps)

  next()
}
