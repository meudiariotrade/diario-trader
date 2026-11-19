# v789 — Checklist integrado e cálculos de operações

Base confirmada: v788 (commit efc4956). Regras: CLAUDE.md lido; sem logs/Analytics Supabase, sem mudança da ponte Profit, sem envio de ordens e sem alteração automática de operações históricas.

## Pré-pregão e Meu dia
- Campos reais de meta, perda máxima, máximo de trades, foco e estado emocional no mesmo fluxo.
- Botões Definir/Escolher abrem o editor no próprio Meu dia, sem depender de sub-abas desmontadas.
- Conclusão exige requisitos verificáveis e confirmação de stop/alvo; EPEET permanece opcional.
- Alteração posterior de plano já concluído invalida a conclusão anterior e exige nova confirmação.

## Lançamentos manuais e gestão de risco
- Contratos WIN/WDO: normalização específica de preços e validação de tick; input ambíguo bloqueado antes de salvar.
- Quantidade sugerida, risco e resultado deixam de aceitar valores com escala incoerente. Recomendações para outros ativos permanecem como estavam.
- Operações antigas não são migradas automaticamente; preço suspeito é excluído de cálculos financeiros até revisão manual.
- NOVOS trades deixam de presumir cumprimento de regra e estado emocional.

## Pós-pregão e Excel
- Verifica fotos cadastradas, stop, avaliação de regras e justificativa da quebra; após importação/edição, reabre a conclusão.
- Excel mantém abas Operações e Checklist e acrescenta Revisao por trade, com pendências e referências das fotos. O arquivo não comprova disponibilidade física da imagem.
- Para dias com snapshot histórico, a contagem de regras usa o snapshot da época, não a lista atual.

## Limitações
- Sem alteração retroativa de preços e sem arredondamento automático do tick.
- Excel ainda usa XML Spreadsheet 2003 (.xls) para compatibilidade atual, e não incorpora bytes de fotos.
- Fotos armazenadas como identificadores IndexedDB; a existência física do blob precisa de validação assíncrona separada.
