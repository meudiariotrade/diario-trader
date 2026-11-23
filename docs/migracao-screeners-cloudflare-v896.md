# Migração pública de Screeners — v896

## Implementação
- O Worker `diario-screeners-quant` serve o `GET /v1/screeners` exclusivamente de `SCREENER_CACHE`, chaves `universe:v2:BR/US`, com cache compartilhado e ETag. Não solicita o Supabase na leitura feita pelo navegador.
- Snapshots públicos válidos previamente cacheados na Cloudflare foram copiados de v1 para v2 antes de publicar: 159 empresas BR, 624 EUA. Nenhum token JWT, carteira ou informação privada foi copiado.
- Cron Cloudflare `25 2,14 * * *` (02h25/14h25 UTC) coleta no máximo quatro snapshots por dia da Edge Function pública pré-computada antiga, grava em KV e mantém o anterior em caso de falha. Dados com mais de 48 h são sinalizados como históricos (`X-Snapshot-Stale: 1`). A chave expira depois de 7 dias e a tela mostra erro se faltar dado; jamais retorna à consulta pública ao Supabase.
- Filtros de carteira e rankings continuam calculados no navegador sobre universo completo. Falhas de universo não disparam `POST /functions/v1/screeners-quant`. Layout, análises, notas, PDFs, RLS e operações não foram alterados.

## Escopo ainda pendente
**Não é migração completa dos Screeners.** Os 10 crons ativos de catálogo, SEC/CVM, Finnhub e fundamentos e as tabelas `quant_br`/`quant_us` ainda permanecem no Supabase. Esses trabalhos fazem persistência e cálculos usados pelo app e não podem ser desligados sem porta-los para D1/Workers e comparar os resultados; apenas agendá-los pela Cloudflare não reduziria a carga real.
O cron de exportação continua consumindo uma quantidade pequena e limitada de egress Supabase, até a próxima etapa. Evitar consultas aos Logs/Analytics do Supabase.

## Verificação
`node --test tests/cloudflare-screeners-v896.test.cjs`, `npm run build && npm run verify`, depois GET real BR e US e cabeçalhos `X-Snapshot-Source: cloudflare-kv-public-v896`.
Rollback: restaurar Worker anterior por deploy e manter tarefas existentes; nenhum dado/cron/secret removido.
