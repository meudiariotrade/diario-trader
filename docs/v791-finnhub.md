# v791 — Reutilização do Finnhub já conectado ao PWA

Sem abrir novas conexões, sem polling e **sem expor token Finnhub no cliente**. O adaptador lê somente `TRM.TR.px["FH:<ticker>"]` quando o WebSocket atual do aplicativo já trouxe esse símbolo. A ausência de inscrição prévia produz N/D, não aciona uma nova chamada ao Supabase.

O horário do negócio `horarioPreco`/event-time prevalece sobre a hora de gravação no cache. A variação permanece N/D se o evento não contiver fechamento anterior. A cotação é normalizada pelo contrato v787 e traz `stale`/proveniência.

Este commit NÃO habilita novas assinaturas Finnhub nem altera o Terminal. O eventual proxy autorizado de históricos/REST precisa respeitar segredo, rate limits e licença do provedor, e será etapa posterior. Não há alteração de layouts, PDF, Carteira, operações ou consultas de Logs/Analytics do Supabase.
