-- v941: Minimiza egress de Movimentos Fortes.
-- Somente tickers do histórico recente e lista Olho, sem transferir o diário.
-- Função invoker (RLS permanece ativa), invocável APENAS pelo service_role.
CREATE OR REPLACE FUNCTION public.movimentos_ativos_v941()
RETURNS TABLE(user_id uuid, ativos text[])
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $fn$
  SELECT d.user_id,
    ARRAY(
      SELECT DISTINCT v.ticker
      FROM (
        SELECT UPPER(REGEXP_REPLACE(COALESCE(recent.trade->>'ativo', ''), 'F$', '')) AS ticker
        FROM (
          SELECT tr.trade
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(d.data::jsonb->'trades') = 'array'
              THEN d.data::jsonb->'trades' ELSE '[]'::jsonb END
          ) WITH ORDINALITY AS tr(trade, pos)
          ORDER BY tr.pos DESC
          LIMIT 400
        ) AS recent
        UNION ALL
        SELECT UPPER(COALESCE(obs.item->>'a', '')) AS ticker
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(d.data::jsonb->'olho') = 'array'
            THEN d.data::jsonb->'olho' ELSE '[]'::jsonb END
        ) AS obs(item)
      ) AS v
      WHERE v.ticker ~ '^[A-Z0-9][A-Z0-9.:-]{0,21}$'
      ORDER BY v.ticker
    ) AS ativos
  FROM public.diario AS d;
$fn$;
REVOKE ALL ON FUNCTION public.movimentos_ativos_v941() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.movimentos_ativos_v941() TO service_role;
