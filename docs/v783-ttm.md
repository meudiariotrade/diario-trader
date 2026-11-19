# v783 — TTM por competência auditável

Processamento 100% em JavaScript puro para navegador/Web Worker, sem rede e sem consultas ao Supabase.

Utiliza somente observações SEC com formulário admitido, accession válido, start/end explícitos e filed <= data de análise.

Para períodos após o último exercício anual disponível, TTM = FY anterior + YTD corrente - YTD correspondente do ano anterior, sempre mesmo namespace, conceito, unidade e janelas fiscais compatíveis.

Se o YTD homólogo não existe, a métrica retorna N/D em vez de misturar FY antigo com nova competência.

FCF Margin: (Caixa operacional TTM - CAPEX TTM) / Receita TTM. Requer os três componentes nos mesmos intervalos fiscais, não só a mesma data final.

Anual integral é rotulado FY, nunca TTM recente. EPS e payout não são somados sem validar médias ponderadas de ações e direitos econômicos.

Fonte: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
