import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
}

/**
 * Cliente Supabase com service role key — usar APENAS em API routes (servidor).
 * NUNCA importar em componentes cliente.
 */
// Use fetch with no-store so Next.js data cache never serves stale Supabase responses
const fetchNoStore: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' },
  auth: { persistSession: false },
  global: { fetch: fetchNoStore },
});
