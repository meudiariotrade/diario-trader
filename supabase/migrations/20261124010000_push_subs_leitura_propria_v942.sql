-- v942: somente o dono autenticado pode ler a própria inscrição Web Push
-- para reconciliação pontual do espelho Cloudflare D1.
-- Não autoriza escrita, não concede leitura ao papel anon e mantém RLS ativo.
-- A função notificar continua responsável pelo envio até cutover homologado.

ALTER TABLE public.push_subs ENABLE ROW LEVEL SECURITY;

-- SELECT exclusivo das colunas necessárias à cópia; outras permissões não são concedidas.
GRANT SELECT (id, user_id, sub, prefs, criado)
ON TABLE public.push_subs TO authenticated;

DO $policy$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'push_subs'
     AND policyname = 'push_subs_leitura_propria_v942'
 ) THEN
   EXECUTE $create$
     CREATE POLICY push_subs_leitura_propria_v942
     ON public.push_subs FOR SELECT TO authenticated
     USING ((SELECT auth.uid()) = user_id)
   $create$;
 END IF;
END
$policy$;
