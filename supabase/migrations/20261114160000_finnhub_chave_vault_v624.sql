-- v624: chave da Finnhub no Vault (FINNHUB_API_KEY), lida só pelo servidor (service_role).
create or replace function public.finnhub_chave()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'FINNHUB_API_KEY' limit 1;
$$;
revoke all on function public.finnhub_chave() from public, anon, authenticated;
grant execute on function public.finnhub_chave() to service_role;
