# v782 — Ampliação do catálogo SEC XBRL

Aditivo ao diagnóstico v781. SEC EDGAR companyfacts é a fonte primária; Cloudflare mantém o cache público e o Supabase não recebe tráfego contínuo.

São preservados: accession, formulário, start/end, filed, FY/FP e frame, quando presentes. FY/FP identificam o filing e não são automaticamente a competência de cada fato.

Selecionam-se fluxos (lucro, receita, caixa, dividendos), saldos (ativos, passivos, patrimônio, dívida e caixa), EPS e ações com unidade estrita. Ações aceitam somente 'shares', EPS aceita somente moeda por ação e demais valores exigem moeda.

Datas inválidas, filed antes da competência e unidades incompatíveis não são promovidas. N/D continua preferível a derivar LPA, VPA ou DPA sem prova.

Compatibilidade: rota /v1/sec-xbrl mantém o contrato anterior, com campos opcionais extras; revisão do cache v782-concepts.

Fonte: https://www.sec.gov/search-filings/edgar-application-programming-interfaces

Sem mudança de layout, PDF, secrets, Logs/Analytics do Supabase ou dados privados.
