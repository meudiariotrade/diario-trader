# v902 — Transferência das tabelas privadas para D1

Migração em lote de 28 tabelas com dados de usuário, consultadas pelo Worker somente com o JWT validado no Supabase Auth. Os dados são arquivados por UID na tabela `private_documents`, com chave primária composta, progresso retomável na tabela `private_migration_progress` e lotes de até dez registros. A conta corrente nunca é escolhida pelo navegador; vem da resposta verificada de `/auth/v1/user`.

As consultas de migração ao Supabase REST são **leituras temporárias** e nunca apagam nem reescrevem dados. Nenhuma chamada acessa Logs/Analytics, `erros_app`, `push_log`, `automacao_log` ou `analise_uso`. Dados de mercado públicos não são duplicados no D1 privado; permanecem nas rotas já migradas para Cloudflare.

A partir da v902, ao sincronizar a conta, o navegador avança a migração automaticamente e retoma na próxima sessão se for interrompida, sem intervalos repetitivos. O progresso fica no banco D1. Os registros só são marcados migrados quando confirmada a gravação; em caso de rejeição por RLS ou indisponibilidade, ficam pendentes.

**Atenção:** `private_documents` é, por enquanto, uma cópia fiel dos registros, não uma reimplementação de todos os endpoints PostgREST e Edge Functions. Operações, Carteira e demais funções ainda podem consultar o Supabase até o corte seguro de cada fluxo. Não excluir dados originais antes de validar os totais por tabela e o comportamento em iPhone/PC.

Arquivos: os 46 metadados constam em `private_files`, e os bytes precisam de migração autenticada via KV (v901). Arquivos grandes permanecem em EstudosLocal/IndexedDB com backup.
