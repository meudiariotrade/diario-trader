-- US: priorização dos balanços pendentes no topo real do ranking, sem varrer A-Z por ticker.
CREATE OR REPLACE FUNCTION public.quant_screeners_sec_top(p_limit integer DEFAULT 12)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb)
FROM (
  SELECT ticker,cik,score_quant_us,market_cap_usd
  FROM quant_us.acoes
  WHERE ativo_elegivel AND cik ~ '^[0-9]{10}$'
   AND data_competencia_balanco IS NULL
  ORDER BY score_quant_us DESC NULLS LAST,market_cap_usd DESC NULLS LAST,ticker
  LIMIT least(16,greatest(1,p_limit))
)x;
$$;
REVOKE ALL ON FUNCTION public.quant_screeners_sec_top(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_screeners_sec_top(integer) TO service_role;
