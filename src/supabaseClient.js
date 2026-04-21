import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://neaisihwekincxzgnuwm.supabase.co'
const supabaseAnonKey = 'sb_publishable_SaNhMarUS3_oHSiFTKf80w_mL57ulKh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)