# Revisão de agendamentos e Cloudflare — v731 (17/11/2026)

## Estado conferido no Supabase novo

Projeto vdzwydizostutukppcsj. Existem 23 jobs cron cadastrados, 3 ativos e 20 desativados. Ativos: notificar-leve-v724 (a cada minuto), calendario-push-v724 (de 2 em 2 horas) e noticias-urgentes-leve-v727 (cron a cada 2 min, com janela de coleta interna). Os três apresentaram execuções recentes sem erro no agendador. Sucesso em pg_cron não comprova retorno HTTP 2xx nem exibição visual de Push no iOS.

O SQL da v727 salvo no GitHub configura */5, mas o agendamento atual no banco é */2. Não sobrescrever o estado real com a migração antiga.

A meta de Egress inferior a 0,5 GB/mês permanece sem verificação na cobrança oficial. Os bytes de Content-Length de Edge Functions não abrangem toda a transferência de Database, Storage, Auth e outros serviços. Medir painel Supabase > Usage > Egress.

## Classificação das 20 tarefas antigas

- notificar-tick e resumo-tick (a cada minuto): NÃO RELIGAR; as rotinas leves de Push e os resumos acionados pelo usuário substituem o polling pesado.
- mercado-cache-minuto e fluxo-b3: NÃO RELIGAR; usar fonte direta ou ponte Profit no PC, com cache por ativo e orçamento de chamadas.
- jornal-mesa (a cada 10 min): NÃO RELIGAR; preferir edições agendadas em horários definidos e geração manual, preservando 100% do layout clássico v729.
- aulas-fila (por minuto): evento sob demanda, com limite de concorrência e armazenamento local de áudios e vídeos.
- movimentos, insiders, radar-varrer e radar-cripto: voltar apenas após verificar fontes e necessidade real; snapshots limitados em dias úteis ou consulta sob demanda.
- rotina-matinal, rotina-almoco e rotina-tarde: candidatas a reativação como três snapshots diários, SOMENTE após testar credencial CRON_SECRET e validar chamadas internas macro/adrs, além do Egress.
- rotina-fechamento: candidato a um único lembrete por dia útil, depois de validar permissões, destinatários e deduplicação.
- email-semana: no máximo um disparo semanal sob configuração confirmada do provedor.
- rotinas *-limpa: revisar política de retenção, backup e consequências antes de automatizar DELETE; nenhuma limpeza foi habilitada.

Alguns comandos legados ainda contêm o marcador __CONFIGURAR_NO_VAULT__; portanto, ativá-los diretamente pode causar erros 401 e consumo sem resultado.

## Cloudflare: primeiro piloto seguro

Foi preparado o Worker público em cloudflare/diario-noticias. O coletor usa três RSS, classifica manchetes prioritárias, cacheia uma única resposta compacta em Workers KV e expõe GET /v1/noticias sem tocar no Supabase. O projeto é isolado: NÃO está implantado e o frontend NÃO foi redirecionado, para preservar as notificações que funcionam.

Próximos passos: conectar a conta Cloudflare, criar KV e validar o Worker; coletar 72h de métricas; então integrar o frontend com fallback e avaliar a substituição da coleta duplicada de RSS do monitor Push, mantendo a entrega no Supabase.

Não migrar operações, carteira, arquivos de aula ou componentes do Jornal. Não habilitar dois crons enviando o mesmo aviso.