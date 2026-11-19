# v800 — Contrato de snapshots públicos e ETag

O navegador valida o snapshot de B3/EUA **antes** de gravá-lo em memória/IndexedDB: mercado, tickers únicos, tamanho até 1,8MB, contagem máxima por contrato, campos proibidos de autenticação/usuário e declaração correta de universo completo. Data de atualização futura é recusada. A validação consome exclusivamente a resposta já baixada, sem chamadas adicionais.

Em caso de reprovação, preservar o snapshot anterior e sinalizar modo histórico, sem redirecionar tráfego para Supabase. Sem alterar o Worker em produção ou sua configuração independente, e sem tocar layouts ou PDFs. O ETag de origem é respeitado se houver; este gate não inventa um ETag.

O limite de validação de linhas do universo é 1.500; a RPC pública hoje possui `LIMIT 1001` e esse contrato não deve rejeitar snapshots válidos de 1.001 linhas. Isso **não equivale** a cobertura completa de empresas dos EUA; exigir revisão da ingestão antes de afirmar universo total.

Revisão de integração CI: versão preparada sobre a cadeia cumulativa atual e direcionada à `main`; alterações de outras abas devem permanecer inalteradas.
