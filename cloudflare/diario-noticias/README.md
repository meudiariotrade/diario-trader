# Cloudflare Workers — piloto de notícias públicas (v731)

**Estado:** código preparado no GitHub, mas não implantado nem ligado ao aplicativo. Não altera Supabase, Jornal clássico, Push, carteira nem operações.

O Worker coleta somente manchetes públicas de InfoMoney, Money Times e CNBC e categoriza petróleo, minério, ações e política econômica. Responde em GET /health e GET /v1/noticias. Usa um cron a cada 2 minutos (UTC), controlado em horário de Brasília: coleta a cada 2 minutos entre 09:00–17:59 de segunda a sexta e a cada 10 minutos fora desse período.

Armazena apenas um snapshot compacto por ciclo no KV. Se todas as fontes falharem, preserva a última coleta boa. Informa desatualização acima de 15 minutos. Não transmite cotações, não gera IA/PDF nem consulta dados privados.

## Passos para ativar

1. Criar ou conectar a conta Cloudflare Workers no plano Free.
2. Criar um namespace KV e inserir seu ID real no arquivo wrangler.jsonc, binding NEWS_CACHE. O ID atual é um placeholder e bloqueia um deploy válido.
3. Verificar ALLOWED_ORIGIN e colocar a origem exata do site do PWA sem caminho. Nenhuma chave ou segredo é gravado no repositório.
4. Fazer deploy pela interface Cloudflare ou Wrangler autenticado; verificar /health, aguardar uma coleta e consultar /v1/noticias.
5. Medir 72h de CPU, KV, latência, erros de fontes e cota de requisições. O limite de CPU da oferta Free é 10 ms por execução.
6. Só depois integrar a consulta opcional ao app com fallback atual. Não duplicar notificações: o envio de Push continua no Supabase.

## Cotas previstas para este piloto isolado

Até 720 eventos agendados por dia, com aproximadamente 360 coletas e gravações KV/dia. Workers Free inclui até 100 mil requisições/dia e Workers KV Free até 1.000 gravações/dia (os limites são por conta e podem incluir outros projetos).

## Testes e cuidados

Na raiz do repositório: node --test tests/cloudflare-noticias.test.cjs, ou npm test. Este piloto não reativa nenhum dos 20 crons legados. Fontes RSS podem atrasar, ficar indisponíveis ou limitar acesso; a coleta não equivale a dados profissionais de mercado em tempo real.