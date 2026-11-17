# Supabase v710 — ativação do projeto principal

Projeto principal: `vdzwydizostutukppcsj`
API URL: `https://vdzwydizostutukppcsj.supabase.co`
GitHub Pages: `https://meudiariotrade.github.io/diario-trader/`

## Concluído neste corte
- 17 migrations históricas aplicadas, com adaptações seguras da baseline, URLs de cron e ausência inicial de Vault.
- 3 migrations aditivas v710: base do glossário TTS, desativação de quatro tarefas de cron criadas por migration histórica, revogação de TRUNCATE/REFERENCES/TRIGGER de usuários web.
- 46 tabelas públicas com RLS ativado; as tabelas privadas/servidor sem policies de acesso não receberam policies públicas artificiais.
- 33 Edge Functions deployadas, inclusive `aulas`, `resumo`, `analise`, `pesquisa`, `notificar` e o módulo compartilhado `_shared/ai-router.ts` que NÃO é uma Edge Function isolada.
- `config.js`, `supabase/config.toml`, ponte de vídeo e `release.config.json` atualizados para v710. Build e bundles gerados no workflow de Pages.

## Limites críticos (não interpretar como migração de dados concluída)
- O projeto de destino iniciou com **0 usuários Auth** e **0 segredos no Vault**. A conta conectada ao ChatGPT não possui acesso ao projeto anterior; portanto **nenhuma conta, senha, linha histórica, arquivo ou segredo antigo foi copiado**.
- Após a atualização, as sessões do projeto anterior são invalidadas no navegador. É necessário criar/entrar em uma conta no novo projeto. O login anterior não será automaticamente reconhecido.
- A IA só funcionará quando `GEMINI_API_KEY` e demais variáveis usadas pelas funções forem cadastradas como **Edge Function Secrets** no destino. Nunca armazenar segredos no GitHub nem no frontend.
- Confirmar em **Supabase Dashboard → Authentication → URL Configuration** a URL do site e os redirect URLs; o acesso de confirmação de e-mail pode falhar se apontar para localhost.
- Todos os crons foram mantidos desativados até configurar `CRON_SECRET` correspondente no Vault e nas Edge Functions, chaves VAPID e validar destino e custo. Nenhum polling por segundo foi habilitado.
- A função pública legada `parceiro_ver` dependia do schema privado ausente `partner_internal`. Foi mantida segura (nega acesso, devolvendo NULL), até migração desse componente privado.
- PDFs/resumos do Mentor permanecem locais; enviar texto à IA consome tráfego de Edge Functions. Não alegar Egress global zero.
- O projeto antigo não foi alterado, apagado ou bloqueado por esta versão. Retorno para a configuração anterior pode ser feito revertendo o commit v710.

## Segurança verificada
- 0 tabelas públicas sem RLS.
- Auth `auth.uid()` em policies de dados pessoais; exceções de servidor sem policies públicas são intencionais.
- A função `atalhos_gerar_token` é `SECURITY DEFINER` por design, mas verifica `auth.uid()` e gera token apenas da conta autenticada.
- A baseline antiga tinha `TRUNCATE` concedido a `authenticated`; a migration v710 revoga esse privilégio sem afetar leitura/edição com RLS.

## Manutenção
- As chamadas da ferramenta de migration do conector Supabase recebem versões de execução geradas pelo serviço, mantendo o nome do arquivo SQL. Conferir `supabase migration list` e conciliar o histórico antes de usar `supabase db push` automaticamente num novo ambiente.
- Nunca colocar `SUPABASE_ACCESS_TOKEN`, `service_role`, chaves de IA ou senha de Postgres em arquivos publicados.
