# v894 — Corte das leituras públicas do Supabase para Cloudflare

## Motivação
Na v893 o Worker `diario-trader` já atendia `/v1/precos`, `/v1/candles`, `/v1/macro` e `/v1/ewz`, porém o Service Worker recuava para as Edge Functions do Supabase quando os dados falhavam; o cliente sem Service Worker ativo também acessava as quatro Edge Functions diretamente. Isso continuava gerando egress de mercado.

## Implementação
1. `src/shared/mercado-cloudflare-v894.js` é carregado **antes** dos demais módulos e intercepta apenas chamadas legadas àquelas quatro rotas. Executa apenas GET para Cloudflare, eliminando todos os headers de autenticação e parâmetros privados. Respostas inválidas retornam erro controlado sem consultar Supabase.
2. `src/service-worker.js` possui barreira de defesa para clientes legados, sem fallback para Supabase. As rotas de Auth, Diário, Carteira, Operações, push e outras Edge Functions não são interceptadas.
3. Preços são consultados em blocos de até 40 ativos por mercado; resultados são consolidados no navegador sem cortar posições.
4. `src/domains/core/10-fiscal-e-simulacoes.js` consome diretamente `/v1/ewz` da Cloudflare, sem depender de login do Supabase. O Worker devolve cotação EWZ e volatilidade **realizada histórica de 20 dias** a partir do Yahoo Finance; se a cadeia de opções não está disponível, a interface sinaliza isso e nunca apresenta delta, gamma, IV, OI, prêmio líquido ou viés inventados.
5. O Worker de produção versionado em `cloudflare/diario-noticias/producao-snapshot-v894.mjs` preserva toda lógica anterior; adiciona uma resposta explícita `status: "sem_feed_opcoes"` quando não há feed de opções autorizado. Não grava nada no Supabase.
6. `wrangler.jsonc` referencia o snapshot da v894, preservando os bindings existentes por meio de deploy controlado.

## Fonte de opções ainda necessária
O antigo Supabase consultava o JSON não oficial de delayed quotes da Cboe. As páginas oficiais da Cboe advertem contra extração automática de tabelas de cotações e sua política de dados exige verificar direitos de uso/redistribuição. Sem feed devidamente autorizado, a v894 **não simula** opções. A cotação e volatilidade histórica seguem disponíveis, mas métricas de fluxo de opções permanecem pendentes.

## Segurança, economia e monitoramento
- Nenhum JWT, chave Supabase, dados privados ou parâmetro de usuário é transmitido ao Worker de mercado público.
- Em falha da Cloudflare, o aplicativo informa erro; nunca reacende os antigos endpoints públicos do Supabase.
- Não migrar, apagar ou expor cotações personalizadas de `public.cotacoes` neste corte sem validar as dependências de carteira e RLS. Supabase continua para Auth e persistência privada, e outros agendamentos de notificação permanecem intactos.
- Cliente que ainda carrega versões antigas precisa atualizar o PWA e seu Service Worker. Verificar v894 no iPhone.
- Custo do Supabase não é garantido zerado: ainda há Auth, persistência e agendamentos de notificações. Não consultar Logs/Analytics do Supabase.
- Testar em `npm run build && npm run check && npm run verify` e via GET real dos endpoints Cloudflare.
- Rollback: publicar nova versão restaurando código anterior; não apagar dados nem rotacionar segredos.
