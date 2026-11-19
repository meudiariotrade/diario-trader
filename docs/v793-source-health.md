# v793 — Arbitragem e saúde de cotações

A origem é escolhida por mercado **e ticker exato**, somente a partir de caches que já existem. Verificação independente do timestamp original, preço positivo, domínio de fonte e validade de cada feed. Ausência de resposta não dispara reconexão ou busca no Supabase; expiração gera `ANTIGO`, nunca `EM TEMPO REAL`.

Este módulo não cria WebSocket, polling, assinatura ou leitura de carteira. As fontes permitidas continuam definidas pelo contrato v787. A aplicação só utiliza `DiarioFeedSaude` na aba Técnico da Análises. Indicativo do Cloudflare/TradingView não é confundido com execução real.
