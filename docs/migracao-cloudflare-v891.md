# Diário de Trader v891 — Migração Cloudflare

## Objetivo
Migrar consultas de mercado do Supabase para Cloudflare sem perder o comportamento do app e sem consultar logs/Analytics do Supabase. O layout permanece idêntico.

## Fontes
- Preços: GET /v1/precos, BRAPI e Twelve Data, via Cloudflare, com cache compartilhado. Só ativará após configurar os secrets BRAPI_TOKEN e TWELVE_KEY em diario-trader; manter fallback enquanto não estiver configurado.
- EWZ: GET /v1/ewz e captura no KV. IV Rank exige ao menos 20 dias; até lá permanece fallback legado. Não inventar dados.
- Macro: GET /v1/macro para painéis públicos. Modo diag ainda no Supabase e sem exportar informações personalizadas.
- Candles: GET /v1/candles e GET /v1/diario em Cloudflare. GET /v1/replay para modo replay autenticado do PWA, persistência no D1 HISTORICO e reserva no Supabase em caso de indisponibilidade.
- Radar: Worker separado diario-radar. Cron é definido por horários de UTC, mas o próprio código só executa quando estão presentes todos os requisitos (incluindo service role, IA e push); o serviço antigo fica ativo até homologação.

## Por que o código foi espelhado
O Worker já implantado tinha o replay em D1, ajustes de revista e outras funções ainda não consolidadas nos módulos do GitHub. O arquivo producao-snapshot-v890.mjs é uma cópia do script de produção sem segredos, usada para prevenir o rollback acidental dessas funcionalidades quando o Wrangler fizer deploy. O código modular deve ser reconciliado com esse snapshot antes de substituí-lo.

## Histórico
Contagens conferidas: 127 registros em Supabase e 127 em D1, com ^BVSP 5m (60 dias), VALE3.SA 1m (7 dias) e VALE3.SA 5m (60 dias). Não apagar dados originais antes de comparação do conteúdo.

## Configurações pendentes no painel
- diario-trader: BRAPI_TOKEN e TWELVE_KEY.
- diario-radar: SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT; CRON_SECRET já está presente.

Não compartilhar chaves em repositório, front-end ou relatórios.

## Fallback/rollback
O app volta aos endpoints existentes do Supabase quando Cloudflare falha. Manter funções antigas até homologação fim a fim de preços, replay, EWZ, Macro, Radar e notificações. Não alterar tabelas, RLS, nem consultar logs.
