# v794 — Integridade do OHLCV (client-side)

Valida 400 candles diários ou 250 intradiários, OHLCV sem duplicações, ticker, mercado, período, `as_of` e horário da coleta. A ausência de prova de desdobramento mantém a série **nominal**; não promove `adjustedCandles` exploratórios do Yahoo a séries certificadas. Para ajuste de ações exige `adjustedVerified=true`, ao menos um documento oficial B3/CVM/SEC e correspondência exata dos timestamps.

O Worker e a interface permanecem sem mudanças visuais; cálculos pesados usam o próprio dispositivo. As cotações intradiárias e a homologação de dados não inferem livro de ofertas, custos executáveis ou lucratividade. Sem polling/Edge Function/Supabase novo.
