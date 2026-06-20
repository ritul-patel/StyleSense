import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

console.log("URL:", JSON.stringify(supabaseUrl));
console.log("URL length:", supabaseUrl?.length);
console.log("KEY length:", supabaseAnonKey?.length);
console.log("KEY prefix:", supabaseAnonKey?.slice(0, 20));

export const supabase = createClient(
  supabaseUrl!,
  supabaseAnonKey!
);