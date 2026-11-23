# v892 — Radar Cloudflare sem perda de funções

## Diagnóstico e correções

- Cloudflare Cron usa 1=domingo, 7=sábado: `*/15 13-20 * * 1-5` executaria domingo a quinta. Configuração corrigida para `*/15 13-20 * * MON-FRI`, com correspondência exata no handler `scheduled`.
- Cripto: preserva `7,37 * * * *` (duas varreduras por hora).
- `GEMINI_API_KEY` e as chaves `VAPID_*` deixam de impedir o funcionamento dos algoritmos numéricos; comentários da IA e push ficam opcionais, com histórico e sinais preservados.
- O sinal só recebe `avisado=true` quando `push` retorna sucesso. Um push não enviado não pode ser perdido.
- Mantidos JWT individual, RLS via Supabase, leitura de `cotacoes`, `radar_cfg`, `radar_sinais`, histórico D1 e cálculos de Elliott/Fibonacci/RSI já presentes.
- `SUPABASE_SERVICE_ROLE_KEY` **permanece obrigatório** para processamento autônomo com usuários; jamais expor no navegador, no GitHub ou no relatório.

## Migração com rollback

- Os três crons Supabase `radar-varrer`, `radar-cripto` e `radar-limpa` estavam ativos ao iniciar. **Não foram removidos**.
- O Worker novo mantém a trava `RADAR_CUTOVER_ENABLED=0`: o agendador Cloudflare não processa usuários até haver todas as autorizações necessárias e a configuração de deduplicação estar testada.
- Ao completar segredos e homologar uma varredura autenticada com sinais, push e histórico, desativar apenas os crons legados equivalentes; então habilitar `RADAR_CUTOVER_ENABLED=1`.
- IA e push ficam funcionais como hoje pelo backend Supabase enquanto não há acesso seguro do Worker aos segredos. Nenhuma simulação de dados nem serviço perdido.
- Cloudflare KV é usado para dados públicos; D1 guarda candles/replay; dados pessoais continuam no Supabase.
- Não consultar logs/Analytics Supabase.

## Secrets exigidos para corte efetivo

- Obrigatório: `SUPABASE_SERVICE_ROLE_KEY` como secret do `diario-radar`, gerado no projeto Supabase autorizado.
- Opcionais para cálculo, mas necessários para manter os comentários automáticos e o envio de push pela Cloudflare: `GEMINI_API_KEY`, `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT`.
- `CRON_SECRET` já configurado no Worker, sem divulgação de valor.

## Riscos controlados

- Não há novas abas, mudanças visuais, modificações em Operações/Carteira ou remoção de Edge Functions.
- O Workflow GitHub publica apenas o Worker `diario-radar`, preservando `SELF`, `HISTORICO`, `SUPABASE_URL` e `SUPABASE_ANON_KEY` que já existem na Cloudflare. Nunca publica segredos no repositório.
