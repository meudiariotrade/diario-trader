# v735 — Notícias pelo Cloudflare com fallback seguro

## Situação e evidências
- Usuário mostrou resposta /health com ok true e /v1/noticias com manchetes reais, atualizadas em 17/11/2026 às 14:40:56 UTC.
- Endpoint do Worker: https://diario-trader.lucianosilva43567.workers.dev/v1/noticias
- Worker v734 tem KV, CORS da origem GitHub Pages e coleta RSS em intervalos controlados.

## Estratégia de carregamento
1. Com sessão válida e notícias/Terminal visíveis, consultar Cloudflare (RSS público) e Finnhub diretamente no navegador (general, forex, crypto) em paralelo.
2. Rejeitar cache acima de 15 min, resposta HTTP falha, lista vazia ou payload inválido. Conservar em memória último snapshot do MKT quando todas as fontes falharem.
3. Supabase noticias só quando Cloudflare falha, tem menos de 12 matérias ou o usuário seleciona o filtro X/Breaking. Supabase terminal somente se Cloudflare falha e há poucas matérias.
4. Último recurso: no máximo dois proxies RSS externos, com lógica existente.
5. Converter política_economica do Worker para categoria politica já usada nos filtros. Preservar deduplicação, tradução opcional e evento diario:noticias da mini-grade.
6. Selecionar X/Breaking força atualização para continuar exibindo esses perfis.

## Segurança, custos e compatibilidade
- Endpoint fixo HTTPS serve somente títulos, datas, links e fontes. Não envia token, carteira, operações nem cotações para Cloudflare.
- Nenhuma alteração de Edge Functions, banco ou agendamentos: o cron noticias-urgentes-leve-v727 segue responsável pelo Push offline.
- No erro de Cloudflare/CORS/KV, app usa as fontes antigas. Sem sessão, mantém bloqueio original.
- O Worker pode sofrer atrasos RSS; não é streaming garantido. Egress precisa de medição no Supabase Usage por 24–72h antes de afirmar economia.

## Testes
node --test tests/cloudflare-integracao-v735.test.cjs
npm run verify
Verificar build de Pages, manchetes no iPhone e métricas Cloudflare/Supabase.
