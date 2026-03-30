import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ✅ Nombre explícito: este cliente usa la anon_key pública, NO la service_role_key
export const supabasePublic = createClient(supabaseUrl, supabaseKey);
