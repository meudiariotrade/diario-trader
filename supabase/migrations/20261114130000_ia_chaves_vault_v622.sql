-- v622: chaves dos provedores de IA guardadas no Vault, lidas só pelo servidor (service_role).
create or replace function public.ia_chaves()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(name, decrypted_secret), '{}'::jsonb)
  from vault.decrypted_secrets
  where name in ('GROQ_API_KEY','CEREBRAS_API_KEY','MISTRAL_API_KEY','HF_TOKEN','DEEPSEEK_API_KEY','OPENROUTER_API_KEY','GEMINI_API_KEY','GOOGLE_API_KEY');
$$;
revoke all on function public.ia_chaves() from public, anon, authenticated;
grant execute on function public.ia_chaves() to service_role;
