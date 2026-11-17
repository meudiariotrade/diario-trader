# v738 — Quatro pendências: validação, semanal, agendamentos e Egress

## Validação
Na v737, falhas intermitentes em três suites de navegador diferentes impediram o Pages: vídeo técnico, fixture Profit e ficha de Economia. A execução paralela de quatro Chromium competia por recursos no CI. O teste serial preserva todos os asserts, sem mudar UI, Profit, Journal ou aulas. CI continua bloqueando deploy se falhar.

## Semanal sem Resend
RESEND_API_KEY está ausente. A ação autenticada rotina_semanal gera weekly_reports com dados do Diário já presentes, sem migrar nem modificar operações. Quando houver Resend e consentimento emailSemana não false, envia por e-mail com a implementação anterior; sem Resend, salva o relatório in-app e não afirma envio. Cron uma vez por semana domingo 21h Brasília (0 0 * * 1 UTC), usando chave v724 restrita do Vault. Não aceitar chamada sem segredo.

## Agendamentos
Foram consultados dez ativos e treze desligados. Monitor de Push, notícias e calendário tiveram execuções recentes. Os três panoramas, Jornal, insider, resumo, fechamento e semanal precisam ser conferidos no próximo horário real; sucesso de pg_cron não prova HTTP 200 nem entrega. Um panorama real com 5 grupos, 6 ADRs e 19 eventos foi gerado pelo Cloudflare e persistido sem cinco Edge Functions macro anteriores. Não religar crons pesados antigos.

## Egress — medição parcial
Conector Supabase não disponibilizou a métrica oficial de Usage/Billing. A leitura dos logs mais recentes de 24h encontrou 2.259 registros function_edge_logs e 7.056.765 bytes conhecidos em Content-Length, mas muitas respostas não possuem esse campo. edge_logs tiveram 4.834 entradas potencialmente sobrepostas; PostgREST 140, Storage 22, Realtime 12 sem contagem confiável de bytes. Erros 401 nas Edge macro (233), mesa-macro (174), screener (181) e logos (110), indicando tentativas de requisição sem autorização. Esses números NÃO são Egress total nem comprovam meta menor que 0,5 GB/mês. Confirmar no Usage do Supabase, selecionando projeto vdzwydizostutukppcsj, após 24 e 72 horas; manter correções de cache e fluxo de dados.

## Rollback
Se o semanal falhar, desativar apenas email-semana. Preservar operações/Profit, visual do Jornal, PDF, notificações e dados privados. Nunca inserir segredo em arquivo público.
