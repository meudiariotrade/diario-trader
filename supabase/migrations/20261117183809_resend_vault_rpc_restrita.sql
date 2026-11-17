-- Chave do Resend permanece criptografada no Supabase Vault; jamais armazenar valor aqui.
-- Provisionar manualmente no Vault o segredo denominado diario_resend_api_key.
-- A RPC retorna a credencial exclusivamente a chamadas internas com service_role.
create or replace function public.diario_resend_chave()
returns text
language sql
stable
security definer
set search_path = ''
as $func$
  select ds.decrypted_secret
  from vault.decrypted_secrets as ds
  where ds.name = 'diario_resend_api_key'
  limit 1;
$func$;

revoke all on function public.diario_resend_chave() from PUBLIC, anon, authenticated;
grant execute on function public.diario_resend_chave() to service_role;