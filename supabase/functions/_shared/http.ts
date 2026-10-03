// supabase/functions/_shared/http.ts
// Deno's Response defaults to text/plain without an explicit Content-Type —
// the RN client's supabase.functions.invoke() picks its body parser from that
// header, so a missing one makes it return the raw JSON string instead of a
// parsed object. Every Edge Function that returns JSON to the RN client must
// build its responses with this helper, never a bare `new Response(JSON.stringify(...))`.
export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
