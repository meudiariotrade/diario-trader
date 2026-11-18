-- v756: somente sessão autenticada pode emitir token de atalhos.
-- A função já valida auth.uid(); preservar esse comportamento.
DO $$
DECLARE definicao text;
BEGIN
 SELECT pg_get_functiondef('public.atalhos_gerar_token()'::regprocedure) INTO definicao;
 IF position('auth.uid()' in definicao) = 0 OR position('if uid is null' in lower(definicao)) = 0 THEN
  RAISE EXCEPTION 'Proteção auth.uid() ausente';
 END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.atalhos_gerar_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atalhos_gerar_token() TO authenticated, service_role;
