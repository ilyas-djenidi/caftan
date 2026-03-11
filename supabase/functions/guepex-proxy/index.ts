import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GUEPEX_BASE = 'https://api.guepex.app/v1';
const API_ID    = Deno.env.get('GUEPEX_API_ID')!;
const API_TOKEN = Deno.env.get('GUEPEX_API_TOKEN')!;

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url      = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || '/parcels/';
    const method   = req.method;
    const body     = method !== 'GET' && method !== 'DELETE'
      ? await req.text()
      : undefined;

    const response = await fetch(`${GUEPEX_BASE}${endpoint}`, {
      method,
      headers: {
        'X-API-ID':     API_ID,
        'X-API-TOKEN':  API_TOKEN,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
