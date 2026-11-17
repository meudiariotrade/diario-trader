-- Analises / Screeners Brasil e EUA, estruturas compartilhadas. Sem dados privados da Carteira.
create schema if not exists quant_br;
create schema if not exists quant_us;
create extension if not exists pg_trgm with schema extensions;
create table if not exists quant_br.acoes (ticker text primary key, empresa text not null, setor text, segmento text, tipo_ativo text not null default 'acao', isin text, ativa boolean not null default true,
 roe numeric, roic numeric, dividend_yield numeric, payout_implicito numeric, pl numeric, pvp numeric, ev_ebitda numeric, fcf_yield numeric, margem_liquida numeric, div_liq_ebitda numeric,
 liquidez_diaria_brl numeric, valor_mercado_brl numeric, momentum_12_1 numeric, dist_max_52w numeric, rsi_14 numeric check (rsi_14 between 0 and 100), dist_mm200_pct numeric,
 score_quant_br numeric check (score_quant_br between 0 and 100), cobertura_pct numeric, preco_referencia numeric, fonte_principal text, fundamentais_em date, tecnicos_em date,
 dados_status text not null default 'catalogado', updated_at timestamptz not null default now(),
 constraint br_ticker_upper check(ticker=upper(ticker)));
create table if not exists quant_us.acoes (ticker text primary key, company_name text not null, bdr_ticker text, exchange text not null check(exchange in ('NYSE','NASDAQ')), sector text, industry text, security_type text not null default 'common_stock',
 cik text, active boolean not null default true, roic numeric, roe numeric, forward_pe numeric, peg_ratio numeric, ev_fcf numeric, price_sales numeric, dividend_yield numeric,
 buyback_yield numeric, total_shareholder_yield numeric generated always as (case when dividend_yield is not null and buyback_yield is not null then dividend_yield+buyback_yield end) stored,
 revenue_growth_yoy numeric, eps_growth_yoy numeric, fcf_margin numeric, rule_of_40 numeric generated always as (case when revenue_growth_yoy is not null and fcf_margin is not null then revenue_growth_yoy+fcf_margin end) stored,
 net_debt_ebitda numeric, short_interest_pct numeric, avg_daily_volume_usd numeric, market_cap_usd numeric, momentum_12_1 numeric, rsi_14 numeric check (rsi_14 between 0 and 100), dist_mm200_pct numeric,
 score_quant_us numeric check (score_quant_us between 0 and 100), cobertura_pct numeric, preco_referencia_usd numeric, fonte_principal text, fundamentais_em date, tecnicos_em date,
 dados_status text not null default 'catalogado', updated_at timestamptz not null default now(),
 constraint us_ticker_upper check(ticker=upper(ticker)));
alter table quant_br.acoes enable row level security;
alter table quant_us.acoes enable row level security;
revoke all on schema quant_br, quant_us from public, anon;
revoke all on quant_br.acoes,quant_us.acoes from public,anon,authenticated;
grant usage on schema quant_br,quant_us to authenticated,service_role;
grant select on quant_br.acoes,quant_us.acoes to authenticated;
grant select,insert,update on quant_br.acoes,quant_us.acoes to service_role;
create policy "br_usuarios_autenticados" on quant_br.acoes for select to authenticated using ((select auth.uid()) is not null);
create policy "us_usuarios_autenticados" on quant_us.acoes for select to authenticated using ((select auth.uid()) is not null);
create index if not exists br_quant_score on quant_br.acoes(score_quant_br desc nulls last,ticker) where ativa;
create index if not exists br_quant_setor on quant_br.acoes(setor,score_quant_br desc nulls last) where ativa;
create index if not exists br_quant_liq on quant_br.acoes(liquidez_diaria_brl desc nulls last) where ativa;
create index if not exists br_quant_nome on quant_br.acoes using gin(empresa extensions.gin_trgm_ops);
create index if not exists br_quant_atualizado on quant_br.acoes(updated_at);
create index if not exists us_quant_score on quant_us.acoes(score_quant_us desc nulls last,ticker) where active;
create index if not exists us_quant_setor on quant_us.acoes(exchange,sector,score_quant_us desc nulls last) where active;
create index if not exists us_quant_cap on quant_us.acoes(market_cap_usd desc nulls last) where active;
create index if not exists us_quant_nome on quant_us.acoes using gin(company_name extensions.gin_trgm_ops);
create index if not exists us_quant_atualizado on quant_us.acoes(updated_at);
