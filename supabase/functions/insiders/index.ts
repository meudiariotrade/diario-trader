// Função INSIDERS — compras e vendas de diretores, controladores e da própria empresa (CVM 44 / dados abertos VLMO).
// Toda semana baixa o arquivo da CVM, soma por empresa/mês/cargo, grava em public.insiders e avisa quem opera aquela ação.
import { unzipSync } from 'npm:fflate@0.8.2';
const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY');
const svc = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
async function db(p: string, init: RequestInit = {}) { const r = await fetch(SB + '/rest/v1/' + p, { ...init, headers: { ...svc, ...((init.headers as any) || {}) } }); if (!r.ok) throw new Error('db ' + r.status + ' ' + (await r.text()).slice(0, 160)); const t = await r.text(); return t ? JSON.parse(t) : null; }
// ticker -> começo do nome na CVM (sem acento, maiúsculas); com * = em qualquer parte do nome
const MAPA: Record<string, string> = { PETR4: 'PETROLEO BRASILEIRO', PETR3: 'PETROLEO BRASILEIRO', VALE3: 'VALE S', ITUB4: 'ITAU UNIBANCO HOLDING', BBDC4: 'BCO BRADESCO', BBAS3: 'BCO BRASIL', ABEV3: 'AMBEV', WEGE3: 'WEG S', B3SA3: 'B3 S.A', PRIO3: 'PRIO S', RENT3: 'LOCALIZA', SUZB3: 'SUZANO', GGBR4: 'GERDAU S', GOAU4: 'METALURGICA GERDAU', CSNA3: 'CIA SIDERURGICA NACIONAL', USIM5: 'USINAS SID', MGLU3: 'MAGAZINE LUIZA', LREN3: 'LOJAS RENNER', RADL3: 'RAIA DROGASIL', ELET3: 'CENTRAIS ELET', EQTL3: 'EQUATORIAL', SBSP3: '*SANEAMENTO BASICO', HAPV3: 'HAPVIDA', RDOR3: 'REDE D', BPAC11: 'BCO BTG PACTUAL', ITSA4: 'ITAUSA', SANB11: 'BCO SANTANDER', EMBR3: 'EMBRAER', JBSS3: 'JBS S', BRFS3: 'BRF S', CMIN3: 'CSN MINERACAO', RAIL3: 'RUMO S', VIVT3: 'TELEFONICA BRASIL', TIMS3: 'TIM S', CPLE6: 'CIA PARANAENSE', CMIG4: '*CEMIG', ENGI11: 'ENERGISA S', TOTS3: 'TOTVS', CYRE3: 'CYRELA', MRVE3: 'MRV ENGENHARIA', AZUL4: 'AZUL S', CVCB3: 'CVC BRASIL', RECV3: 'PETRORECONCAVO', BRAV3: 'BRAVA ENERGIA', VBBR3: 'VIBRA ENERGIA', UGPA3: 'ULTRAPAR', CSAN3: 'COSAN S', RAIZ4: 'RAIZEN', NTCO3: 'NATURA', ASAI3: 'SENDAS', PCAR3: 'CIA BRASILEIRA DE DISTRIBUICAO', SLCE3: 'SLC AGRICOLA', KLBN11: 'KLABIN', BBSE3: 'BB SEGURIDADE', CXSE3: 'CAIXA SEGURIDADE', IRBR3: 'IRB', COGN3: 'COGNA', YDUQ3: 'YDUQS', AURA33: 'AURA MINERALS', POMO4: 'MARCOPOLO', DIRR3: 'DIRECIONAL', CURY3: 'CURY' };
const sa = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
function csvLinhas(t: string) { const L = t.split(/\r?\n/).filter(Boolean); const cab = L[0].split(';').map((c) => c.replace(/"/g, '').trim()); return L.slice(1).map((l) => { const v = l.split(';').map((c) => c.replace(/^"|"$/g, '')); const o: Record<string, string> = {}; cab.forEach((c, i) => (o[c] = v[i] ?? '')); return o; }); }
const nb = (s: string) => { const v = parseFloat(String(s || '').replace(/\./g, '').replace(',', '.')); return isFinite(v) ? v : (isFinite(+s) ? +s : 0); };
const n2 = (s: string) => { const t = String(s || '').trim(); return t.includes(',') ? nb(t) : (parseFloat(t) || 0); }; // CVM usa ponto decimal
const casa = (emp: string, n: string) => n.startsWith('*') ? sa(emp).includes(n.slice(1)) : sa(emp).startsWith(n);

async function atualiza() {
  const ano = new Date().getUTCFullYear(), linhas: any[] = [];
  for (const a of [ano - 1, ano]) {
    const r = await fetch(`https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/VLMO/DADOS/vlmo_cia_aberta_${a}.zip`, { signal: AbortSignal.timeout(60_000) });
    if (!r.ok) continue;
    const z = unzipSync(new Uint8Array(await r.arrayBuffer()));
    const nome = Object.keys(z).find((k) => /_con_/.test(k)); if (!nome) continue;
    linhas.push(...csvLinhas(new TextDecoder('windows-1252').decode(z[nome])));
  }
  if (!linhas.length) throw new Error('Arquivo da CVM vazio.');
  const limite = new Date(Date.now() - 100 * 864e5).toISOString().slice(0, 7);
  const ag: Record<string, any> = {};
  for (const x of linhas) {
    const mov = sa(x.Tipo_Movimentacao || ''), ativo = sa(x.Tipo_Ativo || '');
    if (!/ACOES|ACAO|UNIT/.test(ativo)) continue;
    const compra = /COMPRA/.test(mov), venda = /VENDA/.test(mov); if (!compra && !venda) continue;
    const mes = String(x.Data_Movimentacao || x.Data_Referencia || '').slice(0, 7); if (!mes || mes < limite) continue;
    const vol = Math.abs(n2(x.Volume)) || Math.abs(n2(x.Quantidade) * n2(x.Preco_Unitario)); if (!vol) continue;
    const cargo = sa(x.Tipo_Cargo || x.Tipo_Empresa || 'OUTROS').slice(0, 60), emp = sa(x.Nome_Companhia || '');
    const k = emp + '|' + mes + '|' + cargo;
    const o = ag[k] ||= { empresa: x.Nome_Companhia, cnpj: x.CNPJ_Companhia, mes, cargo: x.Tipo_Cargo || x.Tipo_Empresa || 'Outros', compras: 0, vendas: 0 };
    if (compra) o.compras += vol; else o.vendas += vol;
  }
  const L = Object.values(ag).map((o: any) => { const tk = Object.entries(MAPA).filter(([, n]) => casa(o.empresa, n)).map(([t]) => t); return { ...o, tickers: tk.join(','), liquido: +(o.compras - o.vendas).toFixed(2), compras: +o.compras.toFixed(2), vendas: +o.vendas.toFixed(2) }; }).filter((o) => o.tickers);
  for (let i = 0; i < L.length; i += 500) await db('insiders?on_conflict=empresa,mes,cargo', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(L.slice(i, i + 500)) });
  return { L, total: linhas.length, cab: Object.keys(linhas[0] || {}) };
}
let WP: any = null;
async function manda(sub: any, title: string, body: string, tag: string) {
  const pub = ENV('VAPID_PUBLIC'), pri = ENV('VAPID_PRIVATE'); if (!pub || !pri) return false;
  if (!WP) { WP = (await import('npm:web-push@3.6.7')).default; WP.setVapidDetails(ENV('VAPID_SUBJECT') || 'mailto:alertas@example.com', pub, pri); }
  try { await WP.sendNotification(sub.sub, JSON.stringify({ title, body, tag, data: { go: 'mercado', r: 'ins' } }), { TTL: 86400 }); return true; } catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db(`push_subs?id=eq.${sub.id}`, { method: 'DELETE' }).catch(() => null); return false; }
}
const mi = (v: number) => 'R$ ' + (Math.abs(v) / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
async function avisa(L: any[]) {
  const subs = ((await db('push_subs?select=id,user_id,sub,prefs').catch(() => [])) || []).filter((x: any) => x.prefs?.on?.ins !== false);
  const dia = await db('diario?select=user_id,data').catch(() => []);
  const tkUser: Record<string, Set<string>> = {};
  for (const d of dia || []) { const s = new Set<string>(); for (const t of (d.data?.trades || []).slice(-400)) { const a = String(t.ativo || '').toUpperCase().replace(/F$/, ''); if (MAPA[a]) s.add(a); } for (const o of d.data?.olho || []) { const a = String(o.a || '').toUpperCase(); if (MAPA[a]) s.add(a); } tkUser[d.user_id] = s; }
  const fortes = L.filter((o) => Math.abs(o.liquido) >= 1e6);
  let n = 0;
  for (const s of subs) {
    const meus = tkUser[s.user_id]?.size ? tkUser[s.user_id] : new Set(['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'BBDC4']);
    for (const o of fortes) {
      const tk = o.tickers.split(',').find((t: string) => meus.has(t)); if (!tk) continue;
      const k = `ins:${s.id}:${o.empresa}:${o.mes}:${o.cargo}:${o.liquido > 0 ? 'c' : 'v'}`.slice(0, 200);
      if ((await db(`push_log?select=chave&chave=eq.${encodeURIComponent(k)}`))?.length) continue;
      const quem = /COMPANHIA|TESOURARIA|EMISSORA/i.test(sa(o.cargo)) ? 'A própria empresa' : /CONTROLADOR/i.test(sa(o.cargo)) ? 'O controlador' : /CONSELHO/i.test(sa(o.cargo)) ? 'O conselho' : 'A diretoria';
      const ok = await manda(s, `${tk}: ${o.liquido > 0 ? 'insiders compraram' : 'insiders venderam'}`, `${quem} ${o.liquido > 0 ? 'comprou' : 'vendeu'} ${mi(o.liquido)} em ações em ${o.mes.slice(5)}/${o.mes.slice(0, 4)} (dado da CVM, sai com cerca de 10 dias de atraso).`, 'ins-' + tk);
      await db('push_log', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ chave: k, em: new Date().toISOString() }) }).catch(() => {});
      if (ok) n++;
    }
  }
  return n;
}
Deno.serve(async (req) => {
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  const hoje = new Date().toISOString().slice(0, 10);
  try {
    if (b.acao === 'lista') { const L = await db(`insiders?select=empresa,tickers,mes,cargo,compras,vendas,liquido&order=mes.desc&limit=400`); return new Response(JSON.stringify(L), { headers: h }); }
    if ((await db(`push_log?select=chave&chave=eq.insupd:${hoje}`))?.length) return new Response(JSON.stringify({ ok: true, ja: true }), { headers: h });
    await db('push_log', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ chave: 'insupd:' + hoje, em: new Date().toISOString() }) });
    const R = await atualiza(); const n = b.semAviso ? 0 : await avisa(R.L);
    return new Response(JSON.stringify({ ok: true, linhas: R.L.length, total: R.total, cab: R.cab, avisos: n }), { headers: h });
  } catch (e) { await db(`push_log?chave=eq.insupd:${hoje}`, { method: 'DELETE' }).catch(() => {}); return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: h }); }
});
