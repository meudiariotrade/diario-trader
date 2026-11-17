
create or replace function public.quant_screeners_buscar(
 p_market text default 'BR', p_search text default '', p_sector text default '', p_custody text default 'todos',
 p_owned text[] default '{}'::text[], p_liquidity numeric default 0, p_cap text default 'all',
 p_preset text default 'top', p_order text default 'score', p_page integer default 0
) returns jsonb
language sql stable security definer set search_path = ''
as $rpc$
with u as (
 select 'BR'::text mercado,b.ticker,b.empresa nome,b.setor,b.ticker bdr,b.score_quant_br score,b.roe,b.roic,
 b.dividend_yield dy,b.payout_implicito payout,b.pl,b.pvp,b.ev_ebitda,b.fcf_yield,b.div_liq_ebitda,
 b.momentum_12_1 momentum,b.rsi_14,b.dist_mm200_pct mm200,b.liquidez_diaria_brl liquidez,
 b.valor_mercado_brl cap,b.cobertura_pct cobertura,b.updated_at,b.dados_status, to_jsonb(b) dados,
 b.ativa ativo,null::numeric forward_pe,null::numeric peg_ratio,null::numeric total_yield,null::numeric rule40,null::numeric buyback
 from quant_br.acoes b where p_market='BR' and b.ativa
 union all
 select 'US',s.ticker,s.company_name,s.sector,s.bdr_ticker,s.score_quant_us,s.roe,s.roic,
 s.dividend_yield,null::numeric,null::numeric,null::numeric,null::numeric,null::numeric,s.net_debt_ebitda,
 s.momentum_12_1,s.rsi_14,s.dist_mm200_pct,s.avg_daily_volume_usd,s.market_cap_usd,s.cobertura_pct,s.updated_at,s.dados_status,to_jsonb(s),
 s.active,s.forward_pe,s.peg_ratio,s.total_shareholder_yield,s.rule_of_40,s.buyback_yield
 from quant_us.acoes s where p_market='US' and s.active
),
f as materialized (
 select * from u where
 (nullif(left(btrim(p_search),64),'') is null or ticker ilike '%'||left(btrim(p_search),64)||'%' or nome ilike '%'||left(btrim(p_search),64)||'%')
 and (coalesce(p_sector,'')='' or setor=p_sector)
 and (p_custody='todos' or (p_custody='carteira' and (ticker=any(p_owned) or (bdr is not null and bdr=any(p_owned))))
    or (p_custody='fora' and not (ticker=any(p_owned) or (bdr is not null and bdr=any(p_owned)))))
 and (p_market='US' or coalesce(p_liquidity,0)=0 or liquidez >=p_liquidity)
 and (p_market='BR' or p_cap='all' or
 (p_cap='large' and cap>=10000000000) or
 (p_cap='mid' and cap>=2000000000 and cap<10000000000) or
 (p_cap='small' and cap<2000000000))
 and (p_preset='top' or p_preset='' or
 (p_market='BR' and ((p_preset='dividendos' and dy>0 and fcf_yield>0 and payout between 10 and 90)
  or (p_preset='valor' and roic>0 and (pl>0 or ev_ebitda>0))
  or (p_preset='bancos' and roe>0 and pvp is not null and (setor ilike '%banc%' or setor ilike '%financ%' or setor ilike '%segur%'))))
 or (p_market='US' and ((p_preset='compounders' and roic>0 and coalesce((dados->>'eps_growth_yoy')::numeric,0)>0)
  or (p_preset='garp' and peg_ratio>0 and peg_ratio<2)
  or (p_preset='rule40' and rule40>=40)
  or (p_preset='buybacks' and buyback>0))))
),
ordered as (
 select * from f order by
 case when p_order='roe' then roe end desc nulls last,
 case when p_order='roic' then roic end desc nulls last,
 case when p_order='dy' then dy end desc nulls last,
 case when p_order='momentum' then momentum end desc nulls last,
 case when p_order='pvp' then pvp end asc nulls last,
 case when p_order='forward_pe' then forward_pe end asc nulls last,
 case when p_order='yield' then total_yield end desc nulls last,
 score desc nulls last,ticker asc
 limit 50 offset least(100000,greatest(0,p_page))*50
)
select jsonb_build_object(
 'market',p_market,
 'total',(select count(*) from f),
 'page',greatest(0,p_page),
 'page_size',50,
 'rows',coalesce((select jsonb_agg(dados order by
 case when p_order='roe' then roe end desc nulls last,
 case when p_order='roic' then roic end desc nulls last,
 case when p_order='dy' then dy end desc nulls last,
 case when p_order='momentum' then momentum end desc nulls last,
 case when p_order='pvp' then pvp end asc nulls last,
 case when p_order='forward_pe' then forward_pe end asc nulls last,
 case when p_order='yield' then total_yield end desc nulls last,
 score desc nulls last,ticker) from ordered),'[]'::jsonb),
 'coverage',(select jsonb_build_object(
 'com_score',count(score),
 'com_roic',count(roic),
 'com_roe',count(roe),
 'com_dividendos',count(dy),
 'com_momentum',count(momentum),
 'cobertura_media_pct',round(avg(coalesce(cobertura,0)),1),
 'cobertura_70_pct',round(100*count(*) filter(where cobertura>=70)/nullif(count(*),0),1)
 ) from f),
 'medians',(select jsonb_build_object(
 'roe',percentile_disc(0.5) within group (order by roe),
 'roic',percentile_disc(0.5) within group (order by roic),
 'dy',percentile_disc(0.5) within group (order by dy),
 'payout',percentile_disc(0.5) within group (order by payout),
 'momentum',percentile_disc(0.5) within group (order by momentum),
 'forward_pe',percentile_disc(0.5) within group (order by forward_pe),
 'total_yield',percentile_disc(0.5) within group (order by total_yield)) from f),
 'sectors',coalesce((select jsonb_agg(distinct setor) from u where setor is not null),'[]'::jsonb),
 'scatter',coalesce((select jsonb_agg(jsonb_build_object(
 'ticker',ticker,'nome',nome,'setor',setor,'bdr_ticker',bdr,'roe',roe,'roic',roic,'payout',payout,'fcf_yield',fcf_yield,'pvp',pvp,'ev_ebitda',ev_ebitda,
 'dy',dy,'div_liq_ebitda',div_liq_ebitda,'momentum',momentum,'forward_pe',forward_pe,'peg_ratio',peg_ratio,
 'yield',total_yield,'rule40',rule40,'cap',cap,'score',score,'owned',(ticker=any(p_owned) or bdr=any(p_owned))))
 from (select * from f order by score desc nulls last,ticker limit 300) pts),'[]'::jsonb),
 'highlights',coalesce((select jsonb_agg(to_jsonb(x)) from
  (select ticker,nome,score,dy,momentum,roic,roe,cap from f where score is not null order by score desc nulls last limit 4)x),'[]'::jsonb),
 'last_update',(select max(updated_at) from f)
);
$rpc$;
revoke all on function public.quant_screeners_buscar(text,text,text,text,text[],numeric,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.quant_screeners_buscar(text,text,text,text,text[],numeric,text,text,text,integer) to service_role;
