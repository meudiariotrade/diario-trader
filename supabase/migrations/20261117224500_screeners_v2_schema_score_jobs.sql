
-- Somente schemas quantitativos; migration aditiva, sem exclusao de registros.
alter table quant_br.acoes add column if not exists score_model_version text;
alter table quant_br.acoes add column if not exists data_competencia_balanco date;
alter table quant_br.acoes add column if not exists ativo_elegivel boolean not null default false;
alter table quant_br.acoes add column if not exists score_qualidade numeric;
alter table quant_br.acoes add column if not exists score_valuation numeric;
alter table quant_br.acoes add column if not exists score_dividendos numeric;
alter table quant_br.acoes add column if not exists score_momentum numeric;
alter table quant_br.acoes add column if not exists precos_checked_at timestamptz;
alter table quant_br.acoes add column if not exists fonte_precos text;
alter table quant_br.acoes add column if not exists identificador_emissor text;

alter table quant_us.acoes add column if not exists score_model_version text;
alter table quant_us.acoes add column if not exists data_competencia_balanco date;
alter table quant_us.acoes add column if not exists ativo_elegivel boolean not null default false;
alter table quant_us.acoes add column if not exists score_qualidade numeric;
alter table quant_us.acoes add column if not exists score_valuation numeric;
alter table quant_us.acoes add column if not exists score_dividendos numeric;
alter table quant_us.acoes add column if not exists score_momentum numeric;
alter table quant_us.acoes add column if not exists precos_checked_at timestamptz;
alter table quant_us.acoes add column if not exists fonte_precos text;
alter table quant_us.acoes add column if not exists identificador_emissor text;
alter table quant_us.acoes add column if not exists payout_implicito numeric;
alter table quant_us.acoes add column if not exists dist_max_52w numeric;

create index if not exists br_quant_v2_validos on quant_br.acoes (score_quant_br desc nulls last,ticker)
 where ativa and ativo_elegivel;
create index if not exists us_quant_v2_validos on quant_us.acoes (score_quant_us desc nulls last,ticker)
 where active and ativo_elegivel;

create table if not exists quant_br.sync_status(
 id bigint generated always as identity primary key,
 rotina text not null, mercado text not null default 'BR',
 executado_em timestamptz not null default now(),
 itens_processados integer not null default 0,
 itens_com_erro integer not null default 0,
 cobertura_pct numeric, status text not null default 'concluido',
 detalhe text
);
create table if not exists quant_us.sync_status(
 id bigint generated always as identity primary key,
 rotina text not null, mercado text not null default 'US',
 executado_em timestamptz not null default now(),
 itens_processados integer not null default 0,
 itens_com_erro integer not null default 0,
 cobertura_pct numeric, status text not null default 'concluido',
 detalhe text
);
create table if not exists quant_br.snapshot(
 chave text primary key,
 payload jsonb not null default '{}'::jsonb,
 gerado_em timestamptz not null default now()
);
create table if not exists quant_us.snapshot(
 chave text primary key,
 payload jsonb not null default '{}'::jsonb,
 gerado_em timestamptz not null default now()
);
create table if not exists quant_br.setor_medianas(
 setor text primary key,empresas integer not null default 0,
 roe numeric,roic numeric,dy numeric,momentum numeric,
 calculado_em timestamptz not null default now()
);
create table if not exists quant_us.setor_medianas(
 setor text primary key,empresas integer not null default 0,
 roe numeric,roic numeric,dy numeric,momentum numeric,
 calculado_em timestamptz not null default now()
);
alter table quant_br.sync_status enable row level security;
alter table quant_us.sync_status enable row level security;
alter table quant_br.snapshot enable row level security;
alter table quant_us.snapshot enable row level security;
alter table quant_br.setor_medianas enable row level security;
alter table quant_us.setor_medianas enable row level security;
-- Dataset global de mercado: sem dados pessoais. Nenhuma policy aberta a anon/authenticated.
revoke all on quant_br.sync_status,quant_us.sync_status,quant_br.snapshot,quant_us.snapshot,
 quant_br.setor_medianas,quant_us.setor_medianas from public,anon,authenticated;
grant select,insert,update on quant_br.sync_status,quant_us.sync_status,quant_br.snapshot,quant_us.snapshot,
 quant_br.setor_medianas,quant_us.setor_medianas to service_role;
grant usage,select on all sequences in schema quant_br,quant_us to service_role;

create or replace function public.quant_v2_scale(x numeric,lo numeric,hi numeric,rev boolean default false)
returns numeric language sql immutable set search_path='' as $$
 select case when x is null or hi<=lo then null else
 (case when rev then 100-least(100,greatest(0,100*(x-lo)/(hi-lo)))
 else least(100,greatest(0,100*(x-lo)/(hi-lo))) end) end
$$;
create or replace function public.quant_v2_avg(variadic x numeric[])
returns numeric language sql immutable set search_path='' as $$
 select (select avg(v) from unnest(x) as v where v is not null)
$$;
create or replace function public.quant_v2_score(m text,r jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
 q numeric;v numeric;d numeric;mo numeric;tt numeric;
 dy numeric;pl numeric;pay numeric;
 n numeric;
 begin
  dy=nullif(r->>'dividend_yield','')::numeric;
  pl=nullif(r->>'pl','')::numeric;
  pay=nullif(r->>'payout_implicito','')::numeric;
  if m='BR' then
   if (pay is null or pay=0) and dy>0 and pl>0 then pay:=round(dy*pl,4); end if;
   q:=public.quant_v2_avg(public.quant_v2_scale((r->>'roe')::numeric,5,25),public.quant_v2_scale((r->>'roic')::numeric,5,22));
   v:=public.quant_v2_avg(public.quant_v2_scale(pl,5,25,true),public.quant_v2_scale((r->>'ev_ebitda')::numeric,4,18,true),public.quant_v2_scale((r->>'fcf_yield')::numeric,0,12));
   d:=public.quant_v2_avg(public.quant_v2_scale(dy,0,12),case when pay is null then null when pay between 20 and 80 then 90 else 25 end);
   mo:=public.quant_v2_scale((r->>'momentum_12_1')::numeric,-30,50);
   tt:=case when q is null or v is null or d is null or mo is null then null else round(q*.30+v*.30+d*.25+mo*.15,2) end;
  elsif m='US' then
   q:=public.quant_v2_avg(public.quant_v2_scale((r->>'roic')::numeric,5,22),public.quant_v2_scale((r->>'roe')::numeric,5,25),
     public.quant_v2_scale((r->>'fcf_margin')::numeric,0,30),public.quant_v2_scale((r->>'eps_growth_yoy')::numeric,-10,35),
     public.quant_v2_scale((r->>'revenue_growth_yoy')::numeric,-10,35));
   v:=public.quant_v2_avg(public.quant_v2_scale((r->>'forward_pe')::numeric,8,40,true),
     public.quant_v2_scale((r->>'peg_ratio')::numeric,.7,3,true),public.quant_v2_scale((r->>'ev_fcf')::numeric,5,35,true));
   mo:=public.quant_v2_avg(public.quant_v2_scale((r->>'momentum_12_1')::numeric,-30,50),
     public.quant_v2_scale((r->>'dist_mm200_pct')::numeric,-35,35));
   d:=public.quant_v2_avg(public.quant_v2_scale(dy,0,12),
     case when pay is null then null when pay between 0 and 80 then 90 else 25 end);
   tt:=case when q is null or v is null or d is null or mo is null then null else round(q*.30+v*.30+mo*.25+d*.15,2) end;
  else raise exception 'Mercado invalido';end if;
  return jsonb_build_object('total',tt,'qualidade',case when q is null then null else round(q*.30,2) end,
   'valuation',case when v is null then null else round(v*.30,2) end,
   'dividendos',case when d is null then null else round(d*(case when m='BR' then .25 else .15 end),2) end,
   'momentum',case when mo is null then null else round(mo*(case when m='BR' then .15 else .25 end),2) end,
   'payout_efetivo',pay);
end $$;

create or replace function public.quant_v2_recalcular(p_market text)
returns integer language plpgsql security definer set search_path='' as $$
declare result integer;
begin
 if p_market='BR' then
  with s as (select ticker,public.quant_v2_score('BR',to_jsonb(b)) sc from quant_br.acoes b where b.ativa)
  update quant_br.acoes b set
   payout_implicito=coalesce((s.sc->>'payout_efetivo')::numeric,b.payout_implicito),
   score_quant_br=(s.sc->>'total')::numeric,
   score_qualidade=(s.sc->>'qualidade')::numeric,
   score_valuation=(s.sc->>'valuation')::numeric,
   score_dividendos=(s.sc->>'dividendos')::numeric,
   score_momentum=(s.sc->>'momentum')::numeric,
   score_model_version='v2.0',
   ativo_elegivel=(b.ativa and b.liquidez_diaria_brl>=1000000 and coalesce(b.pl,1)>0 and coalesce(b.ev_ebitda,1)>0 and coalesce(b.fcf_yield,0)>=0),
   identificador_emissor=left(b.ticker,4),
   data_competencia_balanco=coalesce(b.data_competencia_balanco,b.fundamentais_em)
   from s where b.ticker=s.ticker;
 elsif p_market='US' then
  with s as (select ticker,public.quant_v2_score('US',to_jsonb(b)) sc from quant_us.acoes b where b.active)
  update quant_us.acoes b set
   score_quant_us=(s.sc->>'total')::numeric,
   score_qualidade=(s.sc->>'qualidade')::numeric,
   score_valuation=(s.sc->>'valuation')::numeric,
   score_dividendos=(s.sc->>'dividendos')::numeric,
   score_momentum=(s.sc->>'momentum')::numeric,
   score_model_version='us_v2.0',
   ativo_elegivel=(b.active and b.exchange in ('NYSE','NASDAQ')
     and coalesce(b.security_type,'stock')='stock'
     and b.avg_daily_volume_usd>=2000000 and b.market_cap_usd>=300000000),
   identificador_emissor=coalesce(nullif(b.cik,''),upper(b.company_name)),
   data_competencia_balanco=coalesce(b.data_competencia_balanco,b.sec_facts_at,b.fundamentais_em)
   from s where b.ticker=s.ticker;
 else raise exception 'Mercado invalido';end if;
 get diagnostics result=row_count;
 return result;
end $$;

create or replace function public.quant_v2_patch_precos(p_market text,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare n integer:=0;
begin
 if p_market not in ('BR','US') or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>50
 then raise exception 'Lote invalido'; end if;
 if p_market='BR' then
  update quant_br.acoes a set
   momentum_12_1=coalesce(x.momentum_12_1,a.momentum_12_1),
   liquidez_diaria_brl=coalesce(x.liquidez_diaria_brl,a.liquidez_diaria_brl),
   preco_referencia=coalesce(x.preco_referencia,a.preco_referencia),
   rsi_14=coalesce(x.rsi_14,a.rsi_14),
   dist_mm200_pct=coalesce(x.dist_mm200_pct,a.dist_mm200_pct),
   dist_max_52w=coalesce(x.dist_max_52w,a.dist_max_52w),
   precos_checked_at=now(),tecnicos_em=current_date,
   fonte_precos=left(coalesce(x.fonte_precos,'Yahoo Chart'),100)
  from jsonb_to_recordset(p_rows) x(ticker text,momentum_12_1 numeric,liquidez_diaria_brl numeric,preco_referencia numeric,
   rsi_14 numeric,dist_mm200_pct numeric,dist_max_52w numeric,fonte_precos text)
  where a.ticker=upper(x.ticker);
 else
  update quant_us.acoes a set
   momentum_12_1=coalesce(x.momentum_12_1,a.momentum_12_1),
   avg_daily_volume_usd=coalesce(x.avg_daily_volume_usd,a.avg_daily_volume_usd),
   preco_referencia_usd=coalesce(x.preco_referencia_usd,a.preco_referencia_usd),
   rsi_14=coalesce(x.rsi_14,a.rsi_14),
   dist_mm200_pct=coalesce(x.dist_mm200_pct,a.dist_mm200_pct),
   dist_max_52w=coalesce(x.dist_max_52w,a.dist_max_52w),
   precos_checked_at=now(),tecnicos_em=current_date,
   fonte_precos=left(coalesce(x.fonte_precos,'Yahoo Chart'),100)
  from jsonb_to_recordset(p_rows) x(ticker text,momentum_12_1 numeric,avg_daily_volume_usd numeric,preco_referencia_usd numeric,
   rsi_14 numeric,dist_mm200_pct numeric,dist_max_52w numeric,fonte_precos text)
  where a.ticker=upper(x.ticker);
 end if;
 get diagnostics n=row_count;
 return n;
end $$;

create or replace function public.quant_v2_precos_pendentes(p_market text,p_limit integer default 12)
returns jsonb language sql stable security definer set search_path='' as $$
 select case when p_market='BR' then
   (select coalesce(jsonb_agg(ticker),'[]'::jsonb) from (
     select ticker from quant_br.acoes where ativa
     order by case when liquidez_diaria_brl>=1000000 then 0 else 1 end,
      precos_checked_at asc nulls first,coalesce(valor_mercado_brl,0) desc,ticker
     limit least(greatest(p_limit,1),30)) q)
 else (select coalesce(jsonb_agg(ticker),'[]'::jsonb) from (
   select ticker from quant_us.acoes where active and exchange in ('NYSE','NASDAQ')
   order by case when market_cap_usd>=300000000 then 0 else 1 end,
     precos_checked_at asc nulls first,market_cap_usd desc nulls last,ticker
   limit least(greatest(p_limit,1),30)) q) end
$$;

create or replace function public.quant_v2_sync_log(p_market text,p_job text,p_items integer,p_errors integer,p_details text default null)
returns void language plpgsql security definer set search_path='' as $$
declare cov numeric;
begin
 if p_market='BR' then
 select round(100*count(*) filter(where score_quant_br is not null)/nullif(count(*),0),1)
 into cov from quant_br.acoes where ativa;
 insert into quant_br.sync_status(rotina,itens_processados,itens_com_erro,cobertura_pct,status,detalhe)
 values(left(p_job,100),greatest(0,p_items),greatest(0,p_errors),cov,
 case when p_errors>0 then 'parcial' else 'concluido' end,left(p_details,350));
 elsif p_market='US' then
 select round(100*count(*) filter(where score_quant_us is not null)/nullif(count(*),0),1)
 into cov from quant_us.acoes where active;
 insert into quant_us.sync_status(rotina,itens_processados,itens_com_erro,cobertura_pct,status,detalhe)
 values(left(p_job,100),greatest(0,p_items),greatest(0,p_errors),cov,
 case when p_errors>0 then 'parcial' else 'concluido' end,left(p_details,350));
 else raise exception 'Mercado invalido';end if;
end $$;

-- Restringir procedimentos privilegiados: nunca acessíveis aos clientes.
revoke all on function public.quant_v2_recalcular(text),public.quant_v2_patch_precos(text,jsonb),
 public.quant_v2_precos_pendentes(text,integer),public.quant_v2_sync_log(text,text,integer,integer,text)
 from public,anon,authenticated;
grant execute on function public.quant_v2_recalcular(text),public.quant_v2_patch_precos(text,jsonb),
 public.quant_v2_precos_pendentes(text,integer),public.quant_v2_sync_log(text,text,integer,integer,text)
 to service_role;
