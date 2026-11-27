-- v1041: cópia única das chaves de push e e-mail para a Cloudflare (Worker diario-radar).
-- Autorizado pelo dono do app. Executável só pelo service_role; anon e authenticated não têm acesso.
-- Migration aditiva: não altera nem remove dados.
create or replace function public.segredos_cloudflare_v1041()
returns table(nome text, valor text)
language sql
security definer
set search_path = ''
as $$
  select s.name::text, s.decrypted_secret::text
  from vault.decrypted_secrets s
  where s.name in ('diario_vapid_public','diario_vapid_private','diario_vapid_subject','diario_resend_api_key');
$$;
revoke all on function public.segredos_cloudflare_v1041() from public;
revoke all on function public.segredos_cloudflare_v1041() from anon;
revoke all on function public.segredos_cloudflare_v1041() from authenticated;
grant execute on function public.segredos_cloudflare_v1041() to service_role;
