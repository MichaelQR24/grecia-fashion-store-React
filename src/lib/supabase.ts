import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Nota: asegúrate de usar NEXT_PUBLIC_SUPABASE_ANON_KEY en el .env

export const supabase = createClient(supabaseUrl, supabaseKey);
