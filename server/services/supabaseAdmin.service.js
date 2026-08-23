import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy server/.env.example to server/.env and fill in real values.'
  )
}

// Bypasses RLS entirely — this client must NEVER be imported into anything
// that runs in the browser. Used only for operations that legitimately need
// to act outside a single user's row-level permissions (currently: none in
// the scaffold; reserved for future admin/aggregate operations). Everyday
// reads/writes should go through the frontend's RLS-governed client instead.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
