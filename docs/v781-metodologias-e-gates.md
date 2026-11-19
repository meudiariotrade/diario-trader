# v781 — Extensão do diagnóstico e plano de execução v781–v804

> Escopo **aditivo** à auditoria original v781: nenhum dos gates de SEC/CVM/XBRL/TTM/linhagem foi removido.
> Fonte de verdade: CLAUDE.md. Não executar consultas a Logs/Analytics do Supabase.
> Não alterar visual de telas, grids, cores, PDF editorial ou outras abas.

## Inventário verificado no repositório
- Motor principal: `src/analysis/tecnico-engine.js`; cálculo no `tecnico-worker.js`.
- Presets e cache local: `src/analysis/tecnico-ui.js` com IndexedDB `diario-tecnico-v762`.
- Fundamentalista em IndexedDB: snapshot `diario-screeners-publicos-v1/snapshots`.
- Screener: `src/analysis/analises.js`; relatório: `src/analysis/screeners-relatorio.js`.
- Cloudflare para OHLCV público e SEC/CVM; Supabase apenas para persistência privada.
- Auditoria original: `scripts/analises-auditoria-v780.cjs`, sem chamadas a APIs ou logs.

## Literatura estudada e decisões conservadoras
1. **IBD/O'Neil**: xícara normalmente requer 7+ semanas, flat base 5+ semanas e profundidade <=15%; a publicação didática da IBD especifica buy point de US$0,10 sobre o pivô em ações dos EUA. A regra do usuário +R$0,01 por tick (B3) é *adaptação explícita*, não transcrição literal universal da IBD. Fonte https://get.investors.com/wp-content/uploads/2024/08/IBDD-How-to-buy-Stocks-infographic.pdf
2. **Pocket Pivot** foi desenvolvido por **Gil Morales e Chris Kacher**, discípulos de O'Neil: volume da barra de alta supera o **maior volume das barras de baixa dos 10 pregões anteriores**; comparação não é volume médio. Fonte https://www.chartmill.com/documentation/technical-analysis/indicators/36-Pocket-Pivots
3. **CAN SLIM** não pode declarar a letra I (patrocínio institucional) nem RS proprietário IBD sem a fonte contratada; a proxy de RS é percentil local, precisa de universo e benchmark válidos. Exibir status *parcial / não calculável* quando indicadores faltarem. Fonte https://www.investors.com/how-to-invest/how-to-buy-stocks-using-stock-lists-stock-ratings-stock-screener/
4. **Stormer / Larry Williams**: 9.2 exige fechamento abaixo da mínima do candle de referência (compra); 9.3 envolve dois candles com restrição própria para o primeiro; não são meramente 'um ou dois candles de correção'. PFR e trap são condicionais com gatilhos futuros, nunca confirmação de execução. Fonte https://flj.com.br/renda-variavel/compra-venda-setup-9-2-9-3/
5. **Flávio Lemos**: EMA 9 e EMA 21, confirmação da inclinação e contexto de 200 períodos, com filtro de tendência; os critérios precisos do padrão 1-2-3 aqui solicitados serão uma implementação parametrizada, não uma atribuição exclusiva ao autor. Fonte https://www.traderbrasil.com/blog/medias-moveis-day-trade.php
6. **Martin Pring KST**: ROC (10,15,20,30), média (10,10,10,15), pesos (1,2,3,4), sinal SMA(9). Fonte https://chartschool.stockcharts.com/table-of-contents/technical-indicators-and-overlays/technical-indicators/prings-know-sure-thing-kst
7. **Bazin**: DPA do período / 0,06, com revisão de proventos extraordinários. Bazin dinâmico 3-5 anos é **adaptação** e deve ser rotulado assim. Fonte https://www.infomoney.com.br/onde-investir/preco-teto-ate-quanto-gastar-com-as-acoes-das-maiores-pagadoras-para-garantir-dividendos-de-6-ao-ano/
8. **Graham**: raiz (22,5 * LPA * VPA), somente ambos positivos. Fonte https://dqydj.com/graham-number-calculator/

## Dados obrigatórios e limitações encontradas
O snapshot BR atual publica `pl`, `pvp`, `roe`, `dividend_yield`, `payout_implicito`, `preco_referencia`, mas não garante LPA, VPA, DPA, número de ações, dividendos anuais ajustados, EPS YoY trimestral ou lucro projetado com linhagem. **É proibido** sintetizar essas métricas a partir de outros múltiplos sem documentar competência, classe da ação, direitos econômicos e data. O cálculo puro deve retornar *N/D* até dados válidos serem obtidos. Em particular:
- Ações PN/ON e units podem ter DPA e LPA distintos; normalizar eventos corporativos.
- `dividend_yield` em percentual e payout em percentual são unidades diferentes de frações.
- Preço referência e fundamento de competências diferentes devem ser datados.
- Lucro projetado = consenso publicado ou cenário do usuário sinalizado, não previsão inventada.
- RS >=80 requer percentil transversal real e cobertura mínima, não RSI 80.
- Candle diário incompleto não permite a validação de bases O'Neil.

## Gates de conclusão
1. Manter o diagnóstico v781 original, comparar com baseline v780 e suas 7 verificações.
2. Testes unitários de OBV local/macro, KST, validação de volume, pivôs sem look-ahead, CAN SLIM parcial e 4 métodos de valuation.
3. Testes de integração no Worker, IndexedDB, Tela Técnica, Screener BR, Pesquisa e PDFs com dados N/D.
4. `npm run build && npm run verify` na CI; inspeção de GitHub Actions (não Supabase Analytics).
5. Medir carga pública no Cloudflare, não adicionar polling ao Supabase.
6. Versions v782–v786 completam as lacunas oficiais; v787–v794 dados Profit/Binance/Finnhub/TradingView; v795–v800 Economatica e relatórios, se contratada; v801–v804 testes, revisão, CI, publicação e homologação.
