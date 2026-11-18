# Dados abertos CVM — espelho semanal de comprovantes
O arquivo `cvm-dre-AAAA.json` é derivado exclusivamente dos CSV públicos dos formulários ITR e DFP da
Comissão de Valores Mobiliários, com contas 3.01 e 3.11 das DRE consolidada ou individual.
Fonte primária: https://dados.cvm.gov.br/dataset/cia_aberta-doc-itr (ODbL).
O workflow `Preparar DRE CVM oficial` gera o arquivo no GitHub Actions, sem baixar esses ZIPs no Supabase.
O arquivo contém valores na escala monetária ORIGINAL do CSV, documento_id, data, versão e
a coluna original; não deve ser interpretado como comprovação de ROE, ROIC, TTM,
margens ou recomendações de investimento. Não contém dados privados dos usuários.
