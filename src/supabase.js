import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oswsvyrmglwjutsjebwc.supabase.co";
const SUPABASE_KEY = "sb_publishable_5y9JYn8lhYoBOI4T3Dz9mQ_is0Hs39s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
