import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { fail } from './json.ts';

export interface AuthContext {
  userId: number;
}

// Resolusi Bearer token -> user_id via tabel guest_tokens (lihat migrasi 20261015).
// Semua route privat WAJIB lewat sini agar isolasi antar user ditegakkan server-side.
export async function requireUserId(
  supabase: SupabaseClient,
  req: Request,
): Promise<{ ctx?: AuthContext; error?: Response }> {
  const header = req.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (token === '') {
    return { error: fail(401, 'UNAUTHORIZED', 'Missing bearer token') };
  }

  const { data, error } = await supabase
    .from('guest_tokens')
    .select('user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error !== null || data === null) {
    return { error: fail(401, 'UNAUTHORIZED', 'Invalid token') };
  }
  if (new Date(data.expires_at as string).getTime() < Date.now()) {
    return { error: fail(401, 'UNAUTHORIZED', 'Token expired') };
  }
  return { ctx: { userId: data.user_id as number } };
}

export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
