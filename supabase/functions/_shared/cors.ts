// Header CORS bersama untuk semua response Edge Function.
// Produksi dikunci ke origin Vercel. Dev lokal pakai vite proxy
// (VITE_API_URL kosong -> request relatif /api/...) sehingga satu
// origin statis ini cukup tanpa echo Origin dinamis.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': 'https://halopandu.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function handleOptions(): Response {
  return new Response('ok', { headers: corsHeaders });
}
