# v801 — Gate reprodutível do backtest

O Worker exige OHLCV validado pelo contrato de feed, **400 candles diários** ou 250 intradiários, mercado reconhecido e nenhuma barra posterior à data de decisão (anti-lookahead). Quando insuficiente, devolve `não comprovado` com estatísticas N/D, em vez de métricas fabricadas.

Mesmo com série válida, os resultados continuam **exploratórios** e custos/ajustes corporativos não são considerados auditados por simples flag do cliente. Nenhuma biblioteca externa, API, Supabase ou timer novo. Preserve o cálculo walk-forward, cenários de pior caso e políticas de tratamento de stops do motor existentes.

Revisão de integração CI: etapa preparada com dependências anteriores, preservando Checklist e Operações da v789; publicação somente após teste aprovado e merge sequencial.
