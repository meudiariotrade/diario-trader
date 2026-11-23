# v897 — Finalização da migração dos Screeners públicos

## Arquitetura gratuita
- Cálculos, coleta e enriquecimento público em GitHub Actions, não no Supabase nem em Workers Free de CPU curta.
- Branch `screeners-dados` guarda snapshots BR/US completos, originados do KV Cloudflare, sem usuário, carteira, JWT, ordens ou registros privados.
- Coleta em lotes por TradingView, documentos SEC/CVM mantidos pelos workflows públicos existentes; Finnhub opcional se o Secret `FINNHUB_TOKEN` estiver configurado no GitHub, sem bloquear outras fontes. Nenhum indicador, proof, nota ou último fechamento é inventado.
- Cloudflare `diario-screeners-quant` lê `https://raw.githubusercontent.com/meudiariotrade/diario-trader/screeners-dados/dados-publicos/screeners-BR.json` e EUA; publica apenas pelo KV com ETag e TTL. Não faz novas leituras públicas no Supabase.
- Dez crons legados Supabase devem ser pausados **somente após** confirmar o bootstrap de BR/US no branch, a execução do workflow e a leitura real CF por pelo menos uma rodada. Os jobs não são removidos; rollback é reativá-los em caso de falha comprovada.
- O universo elegível inicial de 159 B3 e 624 EUA é preservado. O catálogo geral é revalidado periodicamente em fontes oficiais. Inclusão de novos ativos só após informações suficientes para elegibilidade; não promover tickers sem prova.
- Score e métricas locais seguem com o motor `src/analysis/screeners-inteligencia.js`, mantendo as regras existentes. O Selo/Prova CVM/SEC continua dependente de documentação oficial.

## Validação exigida
1. `node --test tests/screeners-v897-autonomos.test.cjs`
2. CI `npm run build && npm run verify`
3. Workflow `Screeners públicos sem Supabase (v897)` com snapshots `BR/US` completos no branch `screeners-dados`
4. Worker: GET BR/US retorna `X-Snapshot-Source: cloudflare-kv-public-v896`, HTTP 200, `universe_complete=true`, `159/624` ativos ou mais.
5. Confirmação jobs Supabase `screeners-%` com `active=false`, preservados.
6. **Não** consultar Logs/Analytics Supabase.

## Limitações transparentes
- Ausência do secret Finnhub no GitHub não bloqueia leitura pública, mas impede a coleta direta daquela API; preservar dados pré-existentes e usar SEC/TradingView quando disponíveis.
- APIs externas podem bloquear chamadas ou limitar atualização. A interface indica a idade dos dados e mantém a última versão íntegra, sem dados simulados.
- O universo completo do catálogo US (~6.700 símbolos) fica disponível como catálogo, mas a tabela de análise aceita somente ativos elegíveis e comprovados.
