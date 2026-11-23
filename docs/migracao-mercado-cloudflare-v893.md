# v893 — Corte de leituras públicas para Cloudflare

## O que foi feito
- Roteamento de chamadas `POST /functions/v1/precos`, `/candles`, `/macro` e `/ewz` feitas pelo PWA controlado para o Worker público `diario-trader`, na forma `GET /v1/<função>`.
- Local: `src/service-worker.js`, antes do manipulador de cache (sem alterar layouts, cálculos ou APIs privadas).
- Encaminha apenas os parâmetros públicos necessários: tickers, ativo, intervalo, datas, modo Macro e vencimento EWZ.
- O Service Worker **nunca encaminha** JWT, `apikey`, cookies, identidade, dados de carteira ou dados privados para a Cloudflare.
- Exige resposta HTTP 200 e estrutura JSON mínima por função; quando a Cloudflare falha, dados faltam ou há mais de 40 tickers por mercado, a requisição ORIGINAL para Supabase funciona como fallback de compatibilidade.
- Todos os controles de notificação, `auth`, carteira, operações, Diário e rotas do Radar antigo permanecem fora do roteamento.
- Atualiza PWA para v893, obrigando renovação do Service Worker após o usuário reabrir o aplicativo.

## Situação do EWZ
O Worker `diario-trader` suporta `/v1/ewz`, mas **não tem `EWZ_OPTIONS_URL` configurado**. O feed de opções exige cadeia real de opções com IV, interesse aberto e gregas. É proibido fabricar essas informações. O EWZ deve manter o fallback Supabase até o feed autorizado ser configurado no Worker e testado.
- A chave/token opcional do feed, se exigido, deve ser cadastrada como Secret `EWZ_OPTIONS_TOKEN`, nunca commitada.
- Confirmar qualidade da cadeia de opções, spot, vencimentos, IV rank com histórico suficiente e horário do provedor antes de habilitar corte completo.

## Radar antigo sem uso
- `public.radar_cfg` e `public.radar_sinais` estavam vazias no momento da migração.
- Com validação transacional, jobs Supabase `radar-varrer` (7), `radar-limpa` (8), `radar-cripto` (9) foram **pausados**, sem exclusão. Verificado `active=false`.
- `diario-radar` permanece `RADAR_CUTOVER_ENABLED=0` para não duplicar processamento.
- Os jobs de outras notificações (`notificar-leve-v724`, `noticias-urgentes-leve-v727`, `calendario-push-v724`) permanecem ativos.

## Validação
- `tests/cloudflare-cutover-v893.test.cjs`: Macro, preços, candles, EWZ com fallback, proteção de headers/JWT, contratos inválidos, lote maior que 40 e isolamento de notificações.
- CI executa `npm run build`, `npm run check` e os testes automatizados em `npm run verify`.
- O teste prévio de Cloudflare confirma endpoints `/health`, `/v1/precos`, `/v1/candles`, `/v1/macro`. Os endpoints de `/v1/ewz` devem permanecer marcados pendentes enquanto o feed não estiver configurado.
- A adoção de fonte pela interface após instalação do SW precisa de verificação em navegador real/iPhone; sucesso de testes de contrato não comprova a atualização de todos os dispositivos.

## Rollback
1. Reverter o commit de roteamento v893 (`src/service-worker.js`) e publicar nova versão de PWA.
2. O aplicativo retorna a consultar diretamente as funções anteriores do Supabase assim que o Service Worker novo assume controle.
3. Caso futuramente se decida reativar o Radar legado, usar `SELECT cron.alter_job(7,active := true)`, idem 8 e 9, **somente** após confirmar usuários e desligar qualquer eventual processamento concorrente do `diario-radar`. Sem alteração de dados.
4. Nunca consultar Supabase Logs, Analytics ou Log Query para esta validação.
