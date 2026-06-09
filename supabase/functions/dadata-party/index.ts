import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { inn } = await req.json();
    if (!inn || !/^(\d{10}|\d{12})$/.test(String(inn))) {
      return new Response(JSON.stringify({ error: 'ИНН должен быть 10 или 12 цифр' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const key = Deno.env.get('DADATA_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'DADATA_API_KEY не настроен' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: `DaData ${r.status}: ${text}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const data = await r.json();
    const sug = data?.suggestions?.[0];
    if (!sug) {
      return new Response(JSON.stringify({ error: 'Организация не найдена' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    return new Response(JSON.stringify(out), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});