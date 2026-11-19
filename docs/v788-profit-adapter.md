# v788 — Adaptador Profit Local sem novas consultas

Apenas lê `CQ.pf` e `CQ.saved`, os caches já mantidos pela ponte Profit existente no PC, e normaliza preços/variações/horários via `DiarioFeedContrato` (v787). Dados antigos continuam identificados como ANTIGO; aliases `@WIN` e equivalentes não são tratados como ativos.

A integração é **somente leitura** e não roteia ordens. Não cria timer, WebSocket, chamada HTTP ou consulta ao Supabase; limpa campos não previstos como user_id, quantidade e credenciais. O PWA carrega o adaptador e seus módulos necessários como arquivos estáticos também no cache offline.

Não confundir adaptador da ponte com ProfitDLL. O ProfitDLL depende do produto/credenciais e instalação no Windows; não foram criadas APIs/credenciais nem se reivindica acesso a dados históricos contratados.

Referências oficiais: https://ajuda.nelogica.com.br/hc/pt-br/articles/11166353435035-Introdu%C3%A7%C3%A3o-ao-Produto-DLL-Real-Time ; https://ajuda.nelogica.com.br/hc/pt-br/articles/51583791325211-Como-obter-acesso-%C3%A0-ProfitDLL .

Antes de ativar o ProfitDLL v789: confirmar licença e API, janela local TLS/loopback, reconexão, heartbeat, latência por ativo e formato de histórico OHLCV. Sem autorização de roteamento, manter exclusivamente Market Data.
