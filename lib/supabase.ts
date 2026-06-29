import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const BIOMA_PLACE_ID = "ChIJ7zr_hEWpRwsRbB6uT8I8jEc"
export const BIOMA_UUID = "4ea19741-4c58-43a7-9073-7b200c92bace"
