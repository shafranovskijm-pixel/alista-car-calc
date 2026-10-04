import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const authorize = async (req: Request): Promise<{ ok: boolean; error?: string }> => {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, error: 'Unauthorized' };
  const { data: u, error } = await sb.auth.getUser(token);
  if (error || !u?.user) return { ok: false, error: 'Unauthorized' };
  const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', u.user.id);
  const allowed = (roles ?? []).some((r: { role: string }) => ['admin', 'manager'].includes(r.role));
  return allowed ? { ok: true } : { ok: false, error: 'Forbidden' };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = await authorize(req);
    if (!auth.ok) return json({ error: auth.error }, auth.error === 'Forbidden' ? 403 : 401);

    const { inn } = await req.json();
    if (!inn || !/^(\d{10}|\d{12})$/.test(String(inn))) {
      return json({ error: 'ИНН должен быть 10 или 12 цифр' }, 400);
    }
    const key = Deno.env.get('DADATA_API_KEY');
    if (!key) {
      return json({ error: 'DADATA_API_KEY не настроен' }, 500);
    }
    const r = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${key}`,
      },
      body: JSON.stringify({ query: String(inn) }),
    });
    if (!r.ok) {
      const text = await r.text();
      return json({ error: `DaData ${r.status}: ${text}` }, 502);
    }
    const data = await r.json();
    const sug = data?.suggestions?.[0];
    if (!sug) {
      return json({ error: 'Организация не найдена' }, 404);
    }
    const d = sug.data ?? {};
    const mgmt = d.management ?? {};
    const out = {
      full_name: d.name?.full_with_opf ?? d.name?.full ?? sug.value ?? '',
      short_name: d.name?.short_with_opf ?? d.name?.short ?? '',
      inn: d.inn ?? '',
      kpp: d.kpp ?? '',
      ogrn: d.ogrn ?? '',
      address: d.address?.unrestricted_value ?? d.address?.value ?? '',
      director_name: mgmt.name ?? '',
      director_position: mgmt.post ?? '',
    };
    return json(out);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
