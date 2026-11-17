# v732 — retorno controlado do lembrete de fechamento

Antes desta versão o job rotina-fechamento estava desligado, e seu comando usava um secret ausente no Vault novo, diario_cron_secret. O teste inofensivo (acao desconhecida) com a chave do job v724 retornou HTTP 401. Por isso NÃO é seguro religar os jobs legados diretamente.

## Mudança no código
A Edge Function rotina-cron aceita agora o segredo já existente do job leve, confirmado pela RPC restrita diario_agendamento_chave (somente service_role). Preserva a comparação constante com CRON_SECRET legado, sem expor credenciais. Chamadas inválidas continuam HTTP 401. Não altera dados financeiros, PDF, Jornal, carteira, operações ou Profit.

## Ativação faseada (somente depois do deploy da Edge e teste de autenticação)
Modificar **somente** o job de nome rotina-fechamento para trocar no command o nome do secret diario_cron_secret por diario_agendamento_v724. Preservar hora 20:45 UTC (17:45 Brasília), segunda a sexta. Depois cron.alter_job(id, active := true).

A função rotina-cron faz uma consulta ao RPC rotina_fechamento_pendentes apenas na hora marcada e tenta Web Push uma vez por conta; push_log previne avisos duplicados. Se nenhum destinatário estiver pendente, não envia notificação. Falhas de envio precisam ser verificadas no log automacao_log e retorno da chamada, não apenas em cron.job_run_details.

Os três jobs anteriores (rotina-matinal, rotina-almoco e rotina-tarde) permanecem DESATIVADOS: chamam macro e adrs e exigem nova confirmação de autenticação nas dependências. Não reativar notificar-tick, jornal-mesa, resumo-tick, aulas-fila ou mercado-cache-minuto.

## Validação obrigatória
1. Validar a versão da Edge Function no Supabase.
2. Fazer POST com acao desconhecida e credencial no Vault sem revelar a chave: deve responder HTTP 400; requisição sem chave deve retornar 401.
3. Inspecionar o nome, horário, comando sanitizado e campo active do job após a alteração.
4. No fechamento real, comparar automacao_log, push_log e execução pg_net, sem trazer dados pessoais para logs.
5. Acompanhar Usage > Egress em 24/72h; ausência de aumento não é comprovada por logs de Content-Length.

Sem integração Cloudflare ativa, o coletor em cloudflare/diario-noticias ainda depende da conexão Cloudflare e namespace KV pelo proprietário.