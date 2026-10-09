// Edge Function "precos": busca cotações na brapi (Brasil) e na Twelve Data (EUA + dólar).
// As chaves ficam só nos Secrets do Supabase, nunca no app nem no GitHub.
const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-key",
  "Content-Type": "application/json",
};
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: H });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });
  if (req.headers.get("x-app-key") !== Deno.env.get("APP_SECRET")) return J({ erro: "não autorizado" }, 401);
  const { br = [], us = [] } = await req.json().catch(() => ({}));
  const out = { br: {} as Record<string, number>, us: {} as Record<string, number>, fx: 0, erros: [] as string[] };
  const bt = Deno.env.get("BRAPI_TOKEN") ?? "", td = Deno.env.get("TWELVE_KEY") ?? "";
  const lote = Math.max(1, Number(Deno.env.get("BRAPI_LOTE") ?? "1"));

  for (let i = 0; i < br.length; i += lote) {
    const g = br.slice(i, i + lote).map((s: string) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, ""));
    try {
      const r = await fetch(`https://brapi.dev/api/quote/${g.join(",")}`, { headers: bt ? { Authorization: `Bearer ${bt}` } : {} });
      const j = await r.json();
      for (const q of j.results ?? []) if (q.regularMarketPrice > 0) out.br[q.symbol] = q.regularMarketPrice;
      for (const s of g) if (!out.br[s]) out.erros.push(s);
    } catch { out.erros.push(...g); }
  }

  const ut = [...us.map((s: string) => String(s).toUpperCase().replace(/[^A-Z0-9.\-]/g, "")), "USD/BRL"];
  for (let i = 0; i < ut.length; i += 8) { // plano gratuito: 8 créditos por minuto
    const g = ut.slice(i, i + 8);
    try {
      const r = await fetch(`https://api.twelvedata.com/price?symbol=${encodeURIComponent(g.join(","))}&apikey=${td}`);
      const j = await r.json();
      for (const s of g) {
        const v = g.length === 1 ? j : j[s], p = Number(v?.price);
        if (p > 0) { if (s === "USD/BRL") out.fx = p; else out.us[s] = p; } else out.erros.push(s);
      }
    } catch { out.erros.push(...g); }
  }
  return J(out);
});
