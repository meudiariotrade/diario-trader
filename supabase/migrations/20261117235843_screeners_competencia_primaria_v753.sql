-- v753: competencia contábil verificada SEC/CVM. Somente service_role pode gravar.
CREATE OR REPLACE FUNCTION public.quant_screeners_competencia_patch(p_market text,p_rows jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE n integer := 0;
BEGIN
 IF p_market NOT IN ('BR','US') OR jsonb_typeof(p_rows)<>'array'
 OR jsonb_array_length(p_rows)>200 THEN RAISE EXCEPTION 'Lote de competencia invalido'; END IF;
 IF p_market='BR' THEN
   UPDATE quant_br.acoes a SET data_competencia_balanco=x.data_competencia_balanco,updated_at=now()
   FROM jsonb_to_recordset(p_rows) x(ticker text,data_competencia_balanco date)
   WHERE a.ticker=upper(btrim(x.ticker))
     AND x.data_competencia_balanco BETWEEN '2019-01-01'::date AND current_date
     AND (a.data_competencia_balanco IS NULL OR a.data_competencia_balanco<x.data_competencia_balanco);
 ELSE
   UPDATE quant_us.acoes a SET data_competencia_balanco=x.data_competencia_balanco,updated_at=now()
   FROM jsonb_to_recordset(p_rows) x(ticker text,data_competencia_balanco date)
   WHERE a.ticker=upper(btrim(x.ticker))
     AND x.data_competencia_balanco BETWEEN '2019-01-01'::date AND current_date
     AND (a.data_competencia_balanco IS NULL OR a.data_competencia_balanco<x.data_competencia_balanco);
 END IF;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.quant_screeners_competencia_patch(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quant_screeners_competencia_patch(text,jsonb) TO service_role;
