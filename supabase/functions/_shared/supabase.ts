import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Service-role client: dipakai server-side saja, BYPASS RLS.
// JANGAN expose SERVICE_ROLE_KEY ke frontend. Untuk produksi, pertimbangkan
// RLS policies + anon key agar otorisasi ditegakkan di level database.
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (url === '' || key === '') {
    throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY secrets');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
