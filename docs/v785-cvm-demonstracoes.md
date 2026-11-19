# v785 — CVM BPA/BPP/DFC-MI sem alterar DRE antigo

Fonte oficial: https://dados.cvm.gov.br/dataset/cia_aberta-doc-itr e https://dados.cvm.gov.br/dataset/cia_aberta-doc-dfp.

Extensão da coleta semanal no GitHub Actions: balanço ativo e passivo consolidados/individuais, fluxo de caixa indireto, filtrados pelo mesmo CNPJ, número do documento, versão, moeda, competência e grupo usados na DRE.

Contas elegíveis: ativo total/circulante/não circulante; passivo circulante/não circulante e patrimônio líquido; caixa operacional e fluxo de investimento total. Este último NÃO é CAPEX, não utilizar para calcular FCF.

Conserva valor original CSV, escala (MIL/UNIDADE), conta e documento; não infere TTM. Falta de arquivo extra não bloqueia a DRE antiga; lacuna fica sinalizada.

O espelho CVM DRE original permanece com o mesmo formato e tamanho previsto pelo endpoint público. Contas extras são exportadas para arquivo separado cvm-demonstracoes-AAAA.json, sujeito à validação antes de consumo pela aba.

Não houve consulta a Logs/Analytics ou tabelas privadas do Supabase.
