# v787 — Contrato único de dados de mercado

Motor puro em `src/analysis/feed-contract-v787.js` (sem fetch, SDK, Supabase ou segredos). Normaliza ticker e OHLCV, preserva timestamp de origem, impõe mínimo 400 candles diários e proíbe selo EM TEMPO REAL para TradingView/Cloudflare (fontes indicativas).

Prioridades: BR Profit Local; EUA Finnhub; Cripto Binance. Fontes atrasadas só como última referência com status ANTIGO; não inventar negociações em tempo real.

Conectores e feeds reais são entregas separadas das v788–v793. Este contrato **não conecta** os provedores por si só. Nenhuma mudança visual na aba.
