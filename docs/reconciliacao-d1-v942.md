# v942 — Reconciliação incremental de espelhos privados D1

## Problema comprovado
Após a cópia inicial, `private_migration_progress.finished=1` bloqueava novas leituras das coleções. Os serviços legados continuavam gravando no Supabase.

Contagens observadas antes da correção (23/11/2026, somente tabelas operacionais; zero consulta a logs):
- `push_subs`: Supabase 2 / Cloudflare D1 1.
- `noticias_urgentes_notificadas`: Supabase 88 / Cloudflare D1 84.

## Mudanças
- Novo `POST /v1/migrate/reconcile` no Worker `diario-sync`, exclusivamente para as duas coleções acima.
- Somente JWT válido; identidade do dono obtida no servidor. Cada consulta PostgREST tem filtro `owner=uid` e os registros recebidos são validados individualmente antes da escrita.
- Política aditiva de RLS para `push_subs`: papel `authenticated` recebe apenas SELECT das colunas existentes e a policy exige `(select auth.uid())=user_id`. Sem leitura anônima e sem novos privilégios de escrita.
- Paginação de até 20 registros por chamada, offsets limitados, body até 500 caracteres e resposta de origem até 1,2 MB.
- Upsert idempotente no D1, sem exclusão. A tabela progressiva recebe a contagem recente.
- A PWA reconcilia uma única vez ao sincronizar, no máximo uma vez a cada 24 horas por conta; não há polling, timers ou cron adicional.
- O Supabase permanece como origem destas duas coleções **até os serviços de Push e notícias terem os seus escritores migrados e homologados**.
- Os arquivos privados, o Diário principal, a interface, os jobs e todas as demais coleções permanecem sem alterações.

## Como homologar
1. Abrir o Diário já autenticado e aguardar a sincronização normal, com a página visível e online.
2. Comparar as contagens por coleção em Supabase e D1 (sem dados privados na resposta de auditoria).
3. Confirmar que não houve erros nas novas chamadas `/v1/migrate/reconcile`; a chamada deve responder `destino: espelho_sem_cutover`.
4. Abrir o aplicativo no PC e iPhone e validar as inscrições Push e o recebimento real, **antes** de qualquer corte dos escritores legados.
5. Se houver falha, o app continuará usando a origem antiga para Push e notícias. Não desativar `notificar`, `radar` ou apagar inscrições.

**Não reivindicar Supabase somente Auth:** além do login, ainda existem escritores privados em Supabase (Push, Radar, relatórios e IA). Os novos espelhos preservam registros, mas não substituem a implementação dessas rotinas.
