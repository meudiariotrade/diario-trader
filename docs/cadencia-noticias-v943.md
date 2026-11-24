# v943 — Ajuste de cadência das notícias urgentes (Cloudflare)

O cron Cloudflare executa a cada minuto para atender os **16 jobs** com horários diferentes. Na v932, a rotina `noticias-urgentes-leve-v727` era invocada no Supabase a cada 5 minutos 24 horas por dia, mesmo quando não havia pregão.

## Mudança implementada
- Dias úteis, **09:00–17:59** no fuso `America/Sao_Paulo`: notícia urgente a cada **5 minutos**.
- Fora dessa janela e nos fins de semana: a cada **15 minutos**.
- `notificar-leve-v724` permanece a cada 5 minutos, preservando avisos de horário, checklist e eventos operacionais. Demais 14 jobs inalterados.
- A função que interpreta o fuso usa `Intl.DateTimeFormat`; a regra atual não consulta calendário de feriados da B3 e se refere à janela operacional de dias úteis.
- O Cloudflare continua sendo o agendador, e o Supabase permanece executor da rotina privada enquanto o corte funcional do Push não for homologado.

## Economia teórica por cron, sem consultar logs do Supabase
- Dia útil: 288 → 168 chamadas diárias de notícias (redução de 120 chamadas, ~42%).
- Fim de semana: 288 → 96 chamadas diárias (redução de 192 chamadas, ~67%).
Esses números descrevem **disparos agendados**, não tráfego em bytes ou redução de egress comprovada. Os minutos de agenda sem chamadas não executam a Edge Function. A função interna pode ter caches, recusar tarefas ou economizar por si própria.

## Segurança
Não muda layout, texto, preços, fórmulas, VAPID, autenticação, dados privados ou chaves. Não toca no Supabase Logs/Analytics. Testes cobrem horários diurnos e noturnos, domingo e preservação do cron de alertas de horário.
