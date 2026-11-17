# Agendamento seguro e orçamento de Egress — v724 (17/11/2026)

## Regra de operação
A função antiga `notificar → tick` tinha consulta de mercado, geração de Jornal/IA, scanner, dados do Profit e diversos avisos em uma única tarefa de 1 minuto. Esse caminho permanece bloqueado por padrão: somente a configuração explícita `ALLOW_HEAVY_NOTIFICATION_TICK=true` pode permiti-lo, e o cron antigo permanece inativo.

Somente estes trabalhos estão ativos:
- `notificar-leve-v724`: 1 vez/minuto, via `pg_cron` + `pg_net`, com secret no Supabase Vault; lê inscrições e eventos próximos em cache; envia horários de checklist, aberturas, eventos econômicos, alguns lembretes de estudo, DARF e trava do dia. Não busca cotações ou gera IA.
- `calendario-push-v724`: às 17min a cada 2 horas (UTC), valida se alguém usa avisos econômicos, busca as fontes existentes e guarda no máximo 250 eventos por ciclo; o job minuto lê até 60 eventos pertinentes (dentro de 60min).

Nenhum registro de operação, carteira, foto ou aula foi migrado, apagado ou editado. A tela do Jornal e os modelos de IA foram preservados.

## Segurança e limites
A credencial `diario_agendamento_v724` só existe no Vault, e a função RPC que a lê permite apenas `service_role`. A tabela `push_calendario_eventos` tem RLS ativado, sem acesso de `anon` ou `authenticated`. O endpoint verifica a assinatura da chamada antes de entrar nos trabalhos. O job leve lê no máximo 20 inscrições por execução e consulta somente eventos no intervalo de 1 hora; o calendário faz no máximo 12 atualizações por dia.

## Limitações conscientes
O agendamento leve **não** envia sinais de preço/stop, monitoração intradiária do Profit, alertas de notícias urgentes, geração automática de Jornal/IA, scanner e outros trabalhos pesados. Eles exigem fontes e orçamentos específicos, ou funcionamento do aplicativo aberto. Não reativar os 20 cron antigos em massa. Também não confundir Edge Functions com Egress: as funções são execução, Egress são bytes transferidos; mesmo com cron novo existe Egress residual.

## Monitoramento e diagnóstico
1. Supabase > Project Usage > Egress: acompanhar Database Egress, Function Egress e Storage Egress, em MB/dia. Registrar valores durante 24-72h antes de reativar qualquer tarefa. O alvo de <0,5GB/mês é meta, **não resultado comprovado**.
2. SQL: `select jobname,schedule,active from cron.job order by jobname;` e `select jobid,status,start_time,return_message from cron.job_run_details order by start_time desc limit 20;`
3. Supabase Logs: observar POST 401 repetidos de `macro`, `screener` e `mesa-macro` e adicionar circuit-breaker no cliente após confirmar origem e sessão. Não afrouxar autenticação por causa desses 401.
4. Supabase Edge Functions > `notificar` > Logs: acompanhar falhas de entrega e tamanho de payload; `push_log` mantém deduplicação e retries.
5. Em caso de falha/banda alta: desativar somente `notificar-leve-v724` e `calendario-push-v724` via `cron.alter_job(jobid,active:=false)`; não remover dados.

## Alternativas avaliadas
- **Supabase pg_cron + pg_net (implantado)**: credenciais no Vault, pouca mudança, minucioso, porém com pequeno tráfego dentro do Supabase.
- **GitHub Actions schedule**: externo ao Supabase, mínimo 5 minutos e atrasos possíveis. Adequado para informes e relatórios não críticos, inadequado para um aviso com antecedência de 3 minutos.
- **Cloudflare Workers Cron Triggers**: bom candidato futuro para coleta, cálculo e feeds, reduzindo transferências no Supabase; o tráfego da resposta do Supabase continua existindo se o Worker consultá-lo. Depende de infraestrutura/conta Cloudflare e configuração de segredos, não migrar sem autorização.
- **Ponte local no PC**: pode coletar Profit sem passar pelo Supabase, enquanto o PC permanecer ligado; não garante push no iPhone sem serviço de entrega sempre ativo.

Referências oficiais: https://supabase.com/docs/guides/functions/schedule-functions , https://supabase.com/docs/guides/platform/manage-your-usage/egress , https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows , https://developers.cloudflare.com/workers/configuration/cron-triggers/ .
