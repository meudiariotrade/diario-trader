# v803 — Homologação determinística integrada

Executar `node scripts/analises-homologacao-v803.cjs` antes de promover uma build. Cobre sete cenários reprodutíveis: módulos sem credenciais/polling (v802), fonte/ticker US, snapshot público sem PII, quatro preços-teto e margem composta, Top10 bloqueado sem prova, backtest insuficiente, OHLCV sem falso ajuste certificado. Usa fixtures fabricadas em memória; **não consulta provedores ou Supabase**, não declara qualidade real de dados ou atualização de Worker externo.

O comando é executado no CI via `tests/analises-v803-homologacao.test.cjs` juntamente com os testes de PWA existentes. Falha impede merge de PR. Não altera UI/PDF. Etapas manuais de homologação ao fim: validação do Profit local Windows com licença, permissão comercial da Economatica MCP, dados oficiais CVM/SEC, latência, cache/ETag do Worker Cloudflare e acessibilidade no iPhone.

Validação de integração CI sobre cadeia cumulativa das versões anteriores, sem alterações nas abas de Operações e Checklist.
