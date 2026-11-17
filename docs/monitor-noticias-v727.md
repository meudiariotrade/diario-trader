# Notícias e notificações v727 — monitor econômico
- Coleta interativa da v726 preservada, inclusive X/Breaking.
- Monitor de breaking news em `notificar`: apenas duas fontes RSS principais, FirstSquawk, DeItaone e Finnhub general (quando disponível). Fallback do X **sequencial**. O monitor não consulta Profit, carteira, cotações ou gera IA/Jornal.
- Cron a cada 5 minutos durante dias úteis 09:00–17:59 em São Paulo; fora, somente a cada 15 minutos (SQL deixa de fazer POST nas demais execuções).
- Usa exclusivamente `diario_agendamento_v724` do Supabase Vault; o antigo `CRON_SECRET` vazio não impede funcionamento.
- Acompanhamento em `public.noticias_monitor_status` com RLS, sem acesso direto de navegador; consulta resumida dentro da ação `diag` para usuário autenticado.
- Preferências independentes: `on.urg` é notícias urgentes e `on.kw` continua sendo apenas palavras-chave da edição do Jornal. A preferência de notícias urgentes é ativada por padrão para quem já autorizou Push, e pode ser desligada na tela.
- Proteções: no máximo 12 notícias por dia/aparelho, 3 por ciclo, deduplicação persistente por usuário, envio confirmado e retentativa via push_log.
- `notificar-tick` continua desativado; não religar cron antigo nem jobs pesados. Custo real do Egress ainda requer acompanhamento por 24–72 horas.
- Entrega real no iOS exige que o PWA instalado permita notificações e uma inscrição push válida; resposta HTTP 200 do servidor não confirma o banner do aparelho.
