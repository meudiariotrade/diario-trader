# v946 — Cotação Profit e atualização da aba Research

## Causa diagnosticada em 23/11/2026
- A ponte PC → `public.cotacoes` segue transmitindo 148 ativos, mas os campos `dat`/`hor` dos negócios são de 23/11/2026 às 18:05–18:31 BRT para ações e futuros. Reenviar o snapshot às 23h não transforma um fechamento em negociação ao vivo.
- O Research reutilizava `preco_referencia` de Screener Cloudflare em cache; o overlay `CQ.pf` só era aplicado se outro módulo tivesse carregado cotações. Além disso, o preço sobreposto não voltava ao valor original quando perdia validade.
- O GitHub Actions produziu BR 159 / US 624 às 21:06 BRT, enquanto a KV Cloudflare usava snapshot da madrugada; o cron da borda ocorria quase duas horas depois do cron GitHub.

## Correções e verificações
1. KV Cloudflare BR e US atualizada para o snapshot público de 23/11 às 21:06 BRT, com verificação de metadados e `pipeline_origin=github-actions-public`. Dados privados e credenciais não trafegaram por cache público.
2. Worker Screener passa a atualizar às 01:15 e 13:15 UTC, após geração às 00:25 e 12:25 nos dias úteis; mesma frequência de duas vezes ao dia, sem custo extra de polling.
3. Research revalida o snapshot público diretamente da Cloudflare, cache-busting por janela de meia hora; consulta apenas por entrada, refresh ou expiração. Usa o cache legado de Screener apenas como contingência, sem fallback ao Supabase.
4. Ao entrar no Research, reaproveita `cqPonte()` com o limitador existente; o evento `diario:profit-cotacoes` notifica alterações de snapshots sem criar timer, requests ou enviar números de operação.
5. O preço fundamentalista é restaurado em cada render antes de aplicar o último negócio; não perpetua sobreposição antiga. Profit com negócio recente no pregão é marcado `ao vivo`; último negócio do dia ou recente fora do pregão, `FECHADO`, com hora de negócio. Fora da janela, mantém preço de referência identificado.
6. Em Mercado, último negócio do Profit fora de pregão fica como `FECHADO` quando a referência TradingView não informa horário comprovadamente mais recente. O TradingView continua reserva; nunca confundir upload com negócio.
7. Pesquisa manual por `↻ Preços` dispara refresh sob demanda do Research e da ponte, sem polling frequente no Supabase.

## Limites
- Supabase permanece como canal de recepção das cotações privadas do PC, com frequência automática máxima de 15 minutos no app; isto não equivale a streaming real. Concluir ponte de segundos sem aumentar egress exige migrar o **escritor Windows** para API autenticada da Cloudflare ou manter rede local segura. Os arquivos Python/Excel da ponte Windows não estão disponíveis no repositório.
- Às 23h BRT a B3 já estava fechada: mostrar `Profit ao vivo` seria informação falsa.
- Operações do Profit são fluxo distinto (`operacoes_profit` não recebeu linhas nas verificações anteriores).
- Não consultar Logs/Analytics do Supabase. Não alterar layout, trades ou cálculos de risco.
