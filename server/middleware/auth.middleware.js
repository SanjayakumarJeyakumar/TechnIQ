import { supabaseAdmin } from '../services/supabaseAdmin.service.js'

/**
 * Verifies the Supabase-issued JWT sent by the frontend in the
 * Authorization header (`Bearer <access_token>`). Attaches `req.user` on
 * success. Every route that touches a secret (the Anthropic API key,
 * service-role-only operations) must sit behind this.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token.' })
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired session.' })
  }

  req.user = data.user
  next()
}
