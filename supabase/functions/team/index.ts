import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const requireAdmin = async (req: Request) => {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false as const, status: 401, error: 'Unauthorized' };
  const { data: u, error } = await sb.auth.getUser(token);
  if (error || !u?.user) return { ok: false as const, status: 401, error: 'Unauthorized' };
  const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', u.user.id);
  const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === 'admin');
  if (!isAdmin) return { ok: false as const, status: 403, error: 'Forbidden' };
  return { ok: true as const, userId: u.user.id };
};

const isValidRole = (r: unknown): r is 'admin' | 'manager' => r === 'admin' || r === 'manager';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? (req.method === 'GET' ? 'list' : '');

    if (req.method === 'GET' && action === 'list') {
      const { data: profiles, error: pErr } = await sb
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: true });
      if (pErr) return json({ error: pErr.message }, 500);
      const { data: roles, error: rErr } = await sb.from('user_roles').select('user_id, role');
      if (rErr) return json({ error: rErr.message }, 500);
      const roleMap = new Map<string, string[]>();
      for (const r of roles ?? []) {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      }
      const members = (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        roles: roleMap.get(p.id) ?? [],
      }));
      return json({ members });
    }

    const body = req.method !== 'GET' ? await req.json().catch(() => ({})) : {};

    if (req.method === 'POST' && action === 'invite') {
      const email = String(body.email ?? '').trim().toLowerCase();
      const role = body.role;
      const fullName = String(body.full_name ?? '').trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'Некорректный email' }, 400);
      }
      if (!isValidRole(role)) return json({ error: 'Некорректная роль' }, 400);

      const redirectTo = `${url.origin.replace(/^https?:\/\/[^/]+/, req.headers.get('origin') ?? url.origin)}/admin/login`;
      const { data: invited, error: iErr } = await sb.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName || email },
        redirectTo,
      });
      if (iErr || !invited?.user) {
        return json({ error: iErr?.message ?? 'Не удалось пригласить пользователя' }, 400);
      }

      const uid = invited.user.id;
      // Ensure profile row exists (handle_new_user trigger usually handles this)
      await sb.from('profiles').upsert({ id: uid, email, full_name: fullName || email });
      // Remove any default role assigned by trigger, then set requested role
      await sb.from('user_roles').delete().eq('user_id', uid);
      const { error: roleErr } = await sb.from('user_roles').insert({ user_id: uid, role });
      if (roleErr) return json({ error: roleErr.message }, 500);

      return json({ ok: true, user_id: uid });
    }

    if (req.method === 'POST' && action === 'set_role') {
      const userId = String(body.user_id ?? '');
      const role = body.role;
      if (!userId) return json({ error: 'user_id обязателен' }, 400);
      if (!isValidRole(role)) return json({ error: 'Некорректная роль' }, 400);
      if (userId === auth.userId && role !== 'admin') {
        return json({ error: 'Нельзя понизить самого себя' }, 400);
      }
      await sb.from('user_roles').delete().eq('user_id', userId);
      const { error: e } = await sb.from('user_roles').insert({ user_id: userId, role });
      if (e) return json({ error: e.message }, 500);
      return json({ ok: true });
    }

    if (req.method === 'POST' && action === 'remove') {
      const userId = String(body.user_id ?? '');
      if (!userId) return json({ error: 'user_id обязателен' }, 400);
      if (userId === auth.userId) return json({ error: 'Нельзя удалить самого себя' }, 400);
      const { error: dErr } = await sb.auth.admin.deleteUser(userId);
      if (dErr) return json({ error: dErr.message }, 500);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Internal error' }, 500);
  }
});