# Auditoria quantitativa v780 — critérios de aceitação

Escopo: **Análises > Screeners Brasil/EUA e Técnico**, sem alterações de layout, PDFs, dados privados ou integrações Profit.

## Regras inegociáveis
- Observar `CLAUDE.md` antes de toda manutenção; **NUNCA** ler Logs/Analytics do Supabase, incluindo Log Explorer/Log Query, `edge_logs`, `postgres_logs` e histórico de execução do cron.
- Dados públicos e recuperação de SEC/CVM na Cloudflare com cache; preparo semanal no GitHub Actions. Supabase somente dados enxutos em RPCs em lote, sem polling de mercado.
- Backtests e indicadores computados no navegador/Web Worker, com recurso encerrado ao desmontar a aba.
- Preservar integralmente layout HTML/CSS e a diagramação dos PDFs.
- Certificação metodológica e prova de fonte **não** são sinônimos de cobertura documental.

## Evidências e gates (não confundir com índice oficial)
1. Documentos oficiais EUA ≥98% entre elegíveis, verificados por accession/form/data/link SEC; ausência exige justificativa auditável.
2. Documentos BR ≥95% por CNPJ + protocolo ITR/DFP CVM; ON/PN não dispensadas.
3. XBRL SEC aplicável ≥90%, distinguindo falta de companyfacts, 403/429 e indisponibilidade de tags para IFRS. Taxas medidas sobre o universo total como métrica conservadora; não fabricar 100%.
4. Linhagem por conceito, unidade, competência e documento ≥85% entre elegíveis americanos. Métrica não comprovada permanece nula.
5. Backtest: RS histórico sem look-ahead, custos reais/ajustes corporativos verificados e holdout com tamanho adequado. Hoje `adjustedVerified:false`, custos hipotéticos; **gate reprova até validação independente**, mesmo quando todos os documentos existem.

## Procedimento de auditoria reprodutível
`node scripts/analises-auditoria-v780.cjs < snapshot-operacional-sem-dados-privados.json > auditoria-v780.md`

Formato de entrada: `{"asOf":"YYYY-MM-DD","rows":[{"market":"US","ticker":"AAPL","eligible":true, ...metadados oficiais...}],"technical":{"noLookAheadVerified":false,"outOfSampleVerified":false,"costsAndCorporateActionsVerified":false}}`.

O arquivo de entrada deve ser explicitamente exportado por uma pessoa autorizada, **apenas** com dados públicos operacionais necessários e sem credenciais. O script não consulta a produção, não inspeciona logs e devolve código de saída 2 quando algum gate falha. Não executar consultas pesadas no banco só para gerar relatório.

## Limitação atual e entrega honesta
A etapa v780 implementa a **capacidade de auditar e bloquear falsas conclusões**. Não é homologação independente e não declara 100% de confiabilidade. O selo só é aprovado com todas as evidências e validação estatística real. O objetivo >72% do índice próprio depende de mensuração documentada e não pode ser inferido diretamente das porcentagens de documentos.

## Versões
- v775: reconciliação CVM + redução de agendamentos redundantes (sem tocar em Push/Jornal).
- v776: XBRL em lotes com cooldown por CIK.
- v777: cálculo fiscal com US GAAP/IFRS e período/unidade coerentes.
- v778: ranking conservador com checagem de proveniência.
- v779: preços nominais separados de série ajustada exploratória.
- v780: auditoria offline, testes e checklist de aceite.

As evidências de publicação vêm exclusivamente dos commits e do GitHub Actions, dos endpoints públicos e das tabelas operacionais mínimas. Não buscar Logs/Analytics Supabase em hipótese alguma.
