# v947 — canal privado Profit na Cloudflare (candidato a homologação)
Base v946. Nenhuma alteração de layout, cálculos, operações ou RLS. Sem consultas de logs Supabase.
- Worker existente: GET/POST /v1/profit-quotes, JWT ES256 do Auth, SQLite Durable Object por sub, no-store, limite de lote, replay e frequência. Somente horário real DAT/HOR; envio não é negócio. Sem armazenamento público.
- PWA consulta a borda em intervalos de 5 s enquanto Research, Mercado Cotações, Live ou Terminal está visível; falha usa o limitador anterior do Supabase (15 min automático), TradingView permanece reserva. Sem leitura frequente do Supabase.
- Escritor Windows: o pacote real v312 de 16/11 foi inspecionado após esta proposta. A implementação inicial de substituição direta NÃO deve ser usada: a migration v635 depende das gravações na tabela cotacoes para construir o Replay 1m. A transição precisa publicar um espelho privado opt-in em paralelo, preservar a ponte original e só desligar a gravação legada após migrar e validar os candles.
- A ponte v312 também inclui FluxoPonte, Agressao, Prints, Relatorios, opções e início automático; esses fluxos devem continuar intactos. Não copiar configurações, sessão ou logs para o repositório.
- Antes de mesclar/publicar: validar CI, Wrangler e quota compartilhada do plano; teste de conta A/B e POST sem token; testar Windows e iPhone durante pregão com a mesma conta, comparar o timestamp e preço de PETR4/VALE3/WIN/WDO, desconectar a ponte e confirmar fallback. Não tratar dados de fechamento como tempo real.

Na recepção, a reserva tem relógio separado e não substitui negócio de borda mais novo. A edição de filtros no Research não perde foco com a chegada das cotações.
