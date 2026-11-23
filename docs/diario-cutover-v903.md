# v903 — Corte seguro e reversível do Diário principal para Cloudflare D1

O login continua no Supabase Auth. O Diário principal só muda as leituras/gravações para o D1 **depois** que o aplicativo compara a cópia D1 com a última versão no Supabase. Se a cópia do D1 estiver mais antiga, permanece no sincronizador anterior e continua espelhando; nenhum dado é sobrescrito no D1 por uma versão antiga.

Quando a cópia está atualizada, a versão v903 usa diretamente `GET/PUT /v1/diario` do Worker privado com UID derivado do token Auth. O controle de revisão e a resposta em conflito (HTTP 409) preservam o mecanismo de merge entre iPhone e PC. O espelho paralelo deixa de duplicar gravações assim que o corte é ativado.

**Não excluímos o banco anterior.** A conferência é refeita quando a página é reaberta, porque aparelhos desatualizados podem ter escrito no Supabase. Portanto, existe leitura legada de verificação na primeira sincronização de cada sessão. Essa é uma transição segura, não uma promessa de zero consultas Supabase no app inteiro.

As outras tabelas privadas ainda precisam ter a migração v902 conferida e seus consumidores transferidos para D1. As Edge Functions privadas, relatórios, notificações e estudos ainda podem usar o backend antigo; fotos e documentos pequenos passam pelo KV v901 e os arquivos grandes permanecem localmente com backup EstudosLocal/IndexedDB.

Não acessar Logs/Analytics Supabase. Manter backup independente antes de remover buckets ou tabelas.
