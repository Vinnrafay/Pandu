import { corsHeaders } from './cors.ts';

// Envelope sukses. GET /dashboard mengembalikan objek mentah (tanpa {data})
// mengikuti kontrak lama; endpoint lain memakai {data} via ok().
export function ok(data: unknown, status = 200): Response {
  return Response.json({ data }, { status, headers: corsHeaders });
}

// Envelope error — dibaca frontend via toApiError (status + code + message).
export function fail(status: number, code: string, message: string): Response {
  return Response.json({ status, code, message }, { status, headers: corsHeaders });
}

export function raw(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders });
}
