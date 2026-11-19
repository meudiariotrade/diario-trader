# v792 — OHLCV nominal e ajuste societário certificado

Nunca misturar preços de execução nominal com séries ajustadas para estudo. A rotina `src/analysis/corporate-candles-v792.js` é pura e executável em Web Worker, sem consultas à rede ou Supabase.

Desdobramento registrado em fonte pública: para candles anteriores à ex-date, OHLC dividido pelo fator de ações novas/antigas e volume multiplicado pelo fator. Candles posteriores à ex-date permanecem inalterados. Dividendos não são ajustados por aproximação; sem documento e calendário comprovado, retorna `verified:false`.

Série spot cripto não tem desdobramento societário. Rejeitar timestamps inválidos, preço negativo, volume negativo e eventos futuros em backtest as-of. Os custos, book e slippage continuam não homologados.

Esse módulo apenas prepara o dado; os conectores reais precisam fornecer eventos verificados e passam pelos gates da v787/v801 antes de permitir indicadores ajustados.
