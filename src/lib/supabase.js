import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://ktpoekyelqnryuaiuwfd.supabase.co'
const SUPABASE_KEY = 'sb_publishable_EGHCZDknB7tleXT1btAmZQ_VC4MGSXe'
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
