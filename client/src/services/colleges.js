import { supabase } from './supabaseClient'

export async function fetchColleges() {
  const { data, error } = await supabase
    .from('colleges')
    .select('id, name, email_domain')
    .order('name')

  if (error) throw error
  return data
}
