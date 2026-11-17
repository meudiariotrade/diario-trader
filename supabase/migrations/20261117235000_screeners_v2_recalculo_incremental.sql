-- Recálculo incremental: evita reescrever 6.757 linhas a cada pequeno lote.
create or replace function public.quant_v2_recalcular_lote(p_market text,p_tickers text[])
returns integer language plpgsql security definer set search_path='' as $$
declare n integer:=0;
begin
 if p_market not in ('BR','US') or array_length(p_tickers,1)>250 then raise exception 'Lote ou mercado invalido'; end if;
 if coalesce(array_length(p_tickers,1),0)=0 then return 0;end if;
 if p_market='BR' then
  with scores as (
   select a.ticker,public.quant_v2_score('BR',to_jsonb(a)) s
   from quant_br.acoes a where a.ativa and a.ticker=any(p_tickers)
  ),v as (
   select ticker,s,(s->>'total')::numeric total,(s->>'payout_efetivo')::numeric payout,
   (s->>'qualidade')::numeric q,(s->>'valuation')::numeric val,
   (s->>'dividendos')::numeric div,(s->>'momentum')::numeric mo from scores
  )
  update quant_br.acoes a set
   payout_implicito=coalesce(v.payout,a.payout_implicito),score_quant_br=v.total,
   score_qualidade=v.q,score_valuation=v.val,score_dividendos=v.div,
   score_momentum=v.mo,score_model_version='v2.0',
   ativo_elegivel=coalesce((a.ativa and a.liquidez_diaria_brl>=1000000 and
    coalesce(a.pl,1)>0 and coalesce(a.ev_ebitda,1)>0 and coalesce(a.fcf_yield,0)>=0),false),
   identificador_emissor=left(a.ticker,4)
  from v where a.ticker=v.ticker and (
    a.score_quant_br is distinct from v.total or
    a.payout_implicito is distinct from coalesce(v.payout,a.payout_implicito) or
    a.score_model_version is distinct from 'v2.0' or
    a.ativo_elegivel is distinct from coalesce((a.ativa and a.liquidez_diaria_brl>=1000000 and
    coalesce(a.pl,1)>0 and coalesce(a.ev_ebitda,1)>0 and coalesce(a.fcf_yield,0)>=0),false)
  );
 else
  with scores as(
   select a.ticker,public.quant_v2_score('US',to_jsonb(a)) s
   from quant_us.acoes a where a.active and a.ticker=any(p_tickers)
  ),v as(
   select ticker,s,(s->>'total')::numeric total,(s->>'qualidade')::numeric q,
   (s->>'valuation')::numeric val,(s->>'dividendos')::numeric div,
   (s->>'momentum')::numeric mo from scores
  )
  update quant_us.acoes a set
   score_quant_us=v.total,score_qualidade=v.q,score_valuation=v.val,
   score_dividendos=v.div,score_momentum=v.mo,score_model_version='us_v2.0',
   identificador_emissor=coalesce(nullif(a.cik,''),upper(a.company_name)),
   ativo_elegivel=coalesce((a.active and a.exchange in ('NYSE','NASDAQ') and
    a.security_type='stock' and a.avg_daily_volume_usd>=2000000 and a.market_cap_usd>=300000000),false)
  from v where a.ticker=v.ticker and (
   a.score_quant_us is distinct from v.total or
   a.score_model_version is distinct from 'us_v2.0' or
   a.ativo_elegivel is distinct from coalesce((a.active and a.exchange in ('NYSE','NASDAQ') and
    a.security_type='stock' and a.avg_daily_volume_usd>=2000000 and a.market_cap_usd>=300000000),false)
  );
 end if;
 get diagnostics n=row_count;return n;
end $$;
revoke all on function public.quant_v2_recalcular_lote(text,text[]) from public,anon,authenticated;
grant execute on function public.quant_v2_recalcular_lote(text,text[]) to service_role;
