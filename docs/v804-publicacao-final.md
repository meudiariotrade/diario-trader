# v804 — Gate de publicação da aba Análises

## Entrega controlada
Publicar somente depois de npm run verify, incluindo scripts e testes de v802, v803 e v804, CI verde nos jobs validate/verify-edge e Deploy Pages confirmado no commit da main.
Preservar Checklist e Operações v789, sem alterar layout, PDF ou tráfego periódico do Supabase. Proibido consultar quaisquer Logs/Analytics.

## Critérios técnicos concluídos pelo código
Fibonaccing macro e níveis negativos; 4 fórmulas de valuation e conciliação SQL/JS em fixtures; feeds isolados por ticker/fonte; OHLCV e ajustes documentados; gate Top 10 por prova; cache público/ETag validado e backtests sem lookahead.
São testes de software e não certificação de cotações, rentabilidade ou cobertura fundamentalista.

## Dependências externas não resolvidas automaticamente
1. ProfitDLL nativa não é entregue pelo número 789: a versão 789 publicada pelo usuário se referiu a Checklist e Operações. A ponte Profit já integrada é leitura local; DLL/ordens exigem licença e validação em Windows.
2. Economatica MCP precisa de licença comercial, OAuth e autorização de uso/redistribuição. V795 é um contrato privado sem cliente MCP ativo nem dados proprietários publicados.
3. Preços justos de todas as empresas precisam de DPA histórico, LPA, VPA, total de ações e documentos CVM com competência/linhagem; não afirmar 100% de cobertura.
4. Cloudflare Worker e Pages são publicações independentes: conferir revisão real do Worker, cache, TTL, ETag, latência, quotas e permissões antes de ativar novos serviços.
5. Testar no iPhone/Windows real: abas, cache offline, exportação PDF sem colisão, Bridge Profit, Finnhub e Binance em pregão, riscos e custos observados.

## Critério final
v804 pode ser publicada como versão de SOFTWARE quando seus gates de código passarem; componentes que dependem de licenças, base oficial incompleta ou ambiente Windows permanecem explicitamente condicionais. Não afirmar homologação externa inexistente.
Homologação final condicionada ao CI da versão 804 e ao deploy Pages do mesmo commit, sem afirmar integrações externas licenciadas ativas.
