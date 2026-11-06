/* v415 — gráfico de linha padrão no Terminal. OHLC e modo candles permanecem disponíveis. */
try { window.TraderTerminalChartStyle = localStorage.getItem('dt-terminal-chart-style') === 'candles' ? 'candles' : 'line'; }
catch (_) { window.TraderTerminalChartStyle = 'line'; }
