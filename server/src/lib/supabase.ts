// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js'
import { supabasePublishableKey, supabaseUrl } from '../config/supabase'

if (!supabasePublishableKey) {
  throw new Error(
    "Missing Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
