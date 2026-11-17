# v736 — Cinco frentes de agendamentos leves

## Contrato de implantação
1. Cloudflare tem o RSS compartilhado e adiciona snapshot de cotações **públicas** em /v1/mercado e /v1/panorama, de 10 em 10 minutos em dia útil das 06h às 20h59 (Brasília). São no máximo 90 novas gravações KV por dia útil; total RSS+mercado projetado abaixo de 500 gravações/dia para este Worker. Sem dados da conta. Qualquer fonte insuficiente/velha retorna 503, nunca cria preços.
2. Monitor de notícias urgentes primeiro consulta o cache RSS Cloudflare; se falhar ou vencer 15 minutos, consulta as três fontes RSS anteriores. Finnhub e X permanecem fontes complementares. Deduplicação/push só no Supabase.
3. Rotina-cron ganhou **matinal_leve**: lê snapshot público válido e agenda já salva, gera panorama_fotos nas 3 janelas sem 5 chamadas aos serviços macro/adrs; se faltar dado, preserva a última foto e registra falha. A função matinal antiga permanece para uso explícito.
4. Rotina-cron ganhou **jornal_agendado** com cache e idempotência internos do motor analise. O motor clássico, prompts, gráficos e PDF são intocados. Só ativar depois de diagnóstico autorizado da credencial CRON_SECRET entre Edge Functions.
5. Aulas: ações do usuário enfileiradas são processadas sob demanda; endpoint avulso processar exige segredo Vault. Resumos: cron de recuperação pode rodar no máximo de 2 em 2 horas, com segredo Vault. E-mail semanal/insiders: disparos em lote exigem segredo Vault, com diagnóstico sem envio para e-mail. Limpezas permanecem desligadas até backup e avaliação de retenção.

## Ativação em produção
Publicar a v736 após CI, deployar Edge Functions: notificar (index.ts, entrega.ts, noticias-urgentes.ts), rotina-cron (index.ts), aulas (index.ts + mentor-pdf.ts + _shared/ai-router.ts), resumo (index.ts), email-semana (index.ts), insiders (index.ts) sem mudar verify_jwt anterior. Antes de religar cada cron, validar autenticação usando ações sem efeitos, depois alterar comando para usar diario_agendamento_v724 do Vault. Nunca ativar as rotinas com placeholders; cron legado jornal-mesa, resumo-tick, email-semana e insiders exigem substituição integral dos comandos. Não alterar o layout do Jornal nem transferir operações.

## Egress: estado e medição
A v735 passou testes e foi publicada; o novo fluxo reduz consultas ao Supabase mas o Egress oficial não pode ser inferido de Content-Length, contagem dos logs ou tabelas. Fonte: Supabase Usage > Egress. Comparar com notebook de auditoria v728 em 24h e 72h. O serviço de preços/streaming e pontes Profit continuam fora deste Worker. Não ativar limpeza DELETE automática nem afirmar <0,5 GB/mês antes dos números reais.

## Rollback
Desativar apenas os cron novos ou reverter v736 no GitHub. Os crons antigos de minuto não devem ser religados. O monitor Push conserva fallback RSS original caso a Cloudflare fique fora do ar. Em caso de feed público insuficiente, preservar o último snapshot.