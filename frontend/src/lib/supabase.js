import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rmbfcfigiuyspsdutzov.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_s-GXOMPHckMxwdl1c7CDkg_T2mOm4wW";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
