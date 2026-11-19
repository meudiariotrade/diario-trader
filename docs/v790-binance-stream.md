# v790 — Binance Spot WebSocket sob demanda

Apenas na sub-aba **Técnico EUA & Cripto**, abre um único WebSocket público agregado para BTCUSDT, ETHUSDT, SOLUSDT e BNBUSDT. Não usa chave, não passa pelo Supabase e não altera o layout do app ou dos PDFs.

Rota permitida pelo CSP existente: `wss://stream.binance.com:9443/stream?streams=...@miniTicker`. O evento `24hrMiniTicker` tem último preço `c`, abertura 24h `o`, símbolo `s` e horário do evento `E`. Cada mensagem é validada pelo contrato único da v787 antes de entrar no cache.

A conexão é encerrada ao sair da aba ou quando o app fica em segundo plano. Sem timers/reconexão automática, sem assinaturas privadas nem ordens; dados anteriores ficam sujeitos a status ANTIGO. O preço em tempo real não substitui OHLCV histórico de 400 barras para backtests.

Limites: a conexão necessita autorização da rede local para domínios da Binance, o stream pode ficar indisponível regionalmente e deve falhar fechado. O usuário precisa verificar precisão/latência antes de operar.

Documentação oficial: https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md
