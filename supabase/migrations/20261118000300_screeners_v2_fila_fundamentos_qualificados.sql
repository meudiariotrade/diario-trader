-- A fila antiga selecionava apenas os tickers mais antigos, gerando chamadas sem retorno.
-- Priorizar papéis líquidos e com mercado conhecido; o catálogo completo permanece intacto.
create or replace function public.quant_v2_fundamentos_pendentes(p_market text,p_limit integer default 40)
returns jsonb language sql stable security definer set search_path='' as $$
 select case when p_market='BR' then
  (select coalesce(jsonb_agg(ticker),'[]'::jsonb) from (
    select ticker from quant_br.acoes where ativa
    order by case when liquidez_diaria_brl>=1000000 then 0 else 1 end,
      coalesce(tecnicos_em,'1900-01-01'::date),coalesce(valor_mercado_brl,0) desc,ticker
    limit least(greatest(p_limit,1),200)) a)
 else
  (select coalesce(jsonb_agg(ticker),'[]'::jsonb) from (
    select ticker from quant_us.acoes where active and security_type='stock'
       and exchange in ('NYSE','NASDAQ')
    order by case when market_cap_usd>=300000000 then 0 else 1 end,
      coalesce(tecnicos_em,'1900-01-01'::date),market_cap_usd desc nulls last,ticker
    limit least(greatest(p_limit,1),200)) b)
 end
$$;
revoke all on function public.quant_v2_fundamentos_pendentes(text,integer) from public,anon,authenticated;
grant execute on function public.quant_v2_fundamentos_pendentes(text,integer) to service_role;
