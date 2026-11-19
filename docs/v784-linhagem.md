# v784 — Linhagem quantitativa da SEC

Sem consultar Logs/Analytics do Supabase ou alterar layout.

Cada indicador SEC exige provas de accession, data de publicação, competência contábil, código XBRL, unidade e valor original.

Receita YoY e EPS YoY são reconciliados por dois exercícios anuais de conceito, namespace e unidade iguais, sem look-ahead.

Margem FCF = (CFO - CAPEX)/Receita; os três valores exigem a mesma competência e accession.

Se uma métrica numérica afirma origem SEC mas falta linhagem, o selo de cálculo completo é bloqueado. Score armazenado continua visível como leitura exploratória com alertas.

Compatibilidade: nenhuma tabela nova ou migration; sem acesso a dados privados. Validação em cliente.
