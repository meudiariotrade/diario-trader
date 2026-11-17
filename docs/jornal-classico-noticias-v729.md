# Restauração editorial e notícias prioritárias — v729

## Referência aprovada
- Jornal de 16/11/2026, edição da noite, PDF enviado pelo usuário com **12 páginas**: capa ilustrada, manchete extensa, 5 fatos, gráfico do dia, WIN/WDO, Diário de Trader, Empresas, Economia, Mundo e agenda.
- Jornal de 17/11/2026, edição da manhã, PDF enviado pelo usuário com **4 páginas** e corpo principalmente tabular.
- A v721 já restaurava a identidade visual v713. A redução de volume foi provocada, principalmente, pela regra em `jornal-quality.js` que zerava TODAS as seções adicionais se uma única matéria divergisse.

## Recuperação segura
- Não alteramos a capa, os gráficos, os assets, fontes ou os componentes visuais do motor v713 restaurado na v721.
- A validação v714/v717 **continua retendo matérias com preço ou evidência divergente**.
- Cada bloco independente (resumo, 5 coisas, análise e fechamento) passa agora por conferência isolada. Um erro na manchete não apaga outros conteúdos que estejam consistentes.
- Se faltarem artigos aprovados, `src/journal/editorial.js` monta editorias de **contexto** a partir exclusivamente das cotações, fontes, sessões e variações do snapshot daquela edição. Essas editorias estão claramente identificadas como contexto, não como reportagens novas ou fatos verificados por outras fontes.
- NÃO substitui o snapshot da data com valores históricos do PDF anterior. Cotações não disponíveis continuam ausentes. Para reabrir a edição histórica de 16/11, use o PDF original.

## Notícias com atualização frequente
- Categorias na aba Notícias: Alto impacto, Petróleo, Minério, Ações e Política econômica. As demais categorias e cards foram preservados.
- Com o aplicativo aberto na aba Notícias, atualização a cada **120 s**; a Edge `noticias` usa cache de **90 s**, com InfoMoney, Money Times, CNBC e X, mais Finnhub direto no navegador.
- Quando não houver notícias suficientes, abre somente dois proxies RSS de contingência, evitando seis pares de proxies simultâneos.
- Push urgente usa somente fontes leves e cron existente: **2 min durante 09:00–17:59 em dias úteis de Brasília**, 10 min fora. Não é streaming instantâneo: RSS e APIs podem ter latência própria.
- Monitor mantém deduplicação persistente e limites por aparelho; adiciona temas identificados como petróleo, minério, ações e política econômica nos alertas.
- Não há execução automática de IA, geração de Jornal ou consultas ao Profit pelo cron de notícias.
- Política: só entra no contexto se houver termo de impacto econômico/mercado; não é cobertura partidária.

## Verificações e limites
- O recebimento do Push no iPhone foi confirmado pelo usuário antes desta versão; a v729 conserva a mesma inscrição e service worker.
- Um feed de terceiros pode falhar; o status de cada feed fica visível na interface ou diagnóstico, sem notícias inventadas.
- O objetivo de Egress permanece dependente do painel de uso do Supabase. Ver notebook v728 já existente.
- Não altera operações, carteira, ponte local nem lógica de ordens.
