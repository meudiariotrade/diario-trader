# Automação institucional — inventário e base de trabalho

Base: main, ef88f80c8bf822bb7f3680f80efa24f5159cd3af; release.config.json = 808; package.json desatualizado em 780 (será regenerado). Branch isolada prep/automacao-institucional-v809. Sem merge/deploy.

CLAUDE.md lido integralmente. Nenhum AGENTS.md encontrado. Preservar identidade visual real do repositório e todos os modelos/fallbacks de IA.

| Função | Implementação existente | Trabalho necessário |
|---|---|---|
| Início / Meu Dia | domains/layers/03-apresentacao.js, checklist fase589/k | integrar sessão por instrumento, preservar manual |
| Inteligência / eventos | shared/inteligencia-integrada.js, intelligence/etapa1.js, etapa2.js | reutilizar barramento e coleta, remover confiança percentual arbitrária |
| ADRs / EWZ | core/04-analises-e-estudos.js; layers/01-navegacao-e-fluxos.js; TraderAdr | respeitar timestamp, classe, razão e sessão; não prever ação |
| Termômetro WIN/WDO | market/termometro-abertura-v670.js | manter pesos/cálculos; fornecer contexto e avisos |
| Agenda econômica | core/07-conta-e-integracoes.js (AG); shared/leitura-mercado.js (surprise) | reaproveitar eventos e comparar unidade/período antes da surpresa |
| Balanços / CVM | BAL em core/08-terminal-e-sazonalidade.js; core/17-fontes-e-balancos.js; dados-publicos | distinguir previsão/documento confirmado |
| Opções | VENC / vencEventos em core/08-terminal-e-sazonalidade.js | reutilizar datas oficiais; não inferir causalidade |
| Sentimento | SNT em core/06-risco-e-tecnico.js | analisar séries da mesma metodologia |
| Notícias e Jornal | cloudflare/diario-noticias; journal/editorial.js | coleta/cache compartilhados, manter editorial |
| Fluxo estrangeiro | FE / feHtml / feCarrega em core/08-terminal-e-sazonalidade.js | ainda existe; restaurar na área existente e explicar deterministicamente |
| Fluxo duplicado | layers/04-design-e-navegacao.js sobrescreve feCarrega para movimentos e depois macro | remover rota dupla para Supabase; cache público Cloudflare |
| Carteira / trades / risco | core/02,03,06,11,12; intelligence/etapa2.js | somente leitura dos helpers validados; não reescrever operações |
| Cabeçalhos técnicos | intelligence/etapa1.js painel(); etapa2.js painel()/mount() | versão v807/v808 redundante; mesmo painel de notícias em nt/jr; fundamentos no topo |
| Memória entre sessões | caches dispersos, sem âncora compartilhada do fechamento B3 | realmente ausente: memória verificável, não resetar por dia civil |
| Calendário unificado | feriados()/pregaoB3 e horários locais dispersos | realmente ausente: calendário com cobertura explícita, fuso e instrumentos |

## Sobreposição e tarefas órfãs identificadas antes da edição de telas
- etapa1.mount e etapa2.mount removem/reinserem seus painéis em cada render mesmo sem mudança de rota: substituição desnecessária.
- etapa1.eligibleRoute trata nt e jr como a mesma tela de notícias: repete o bloco acima do Jornal.
- etapa2.mount insere card técnico antes de #an-root: desloca a análise no iPhone.
- Não foi comprovada montagem simultânea das telas principais nesta auditoria estática; não apagar módulos legados por suposição.
- GOR usa intervalo global de 3s; há outros timers legados. Não confundir esses achados com regressões introduzidas nesta branch. Documentar cobertura real de testes.

## Trabalho paralelo
PR #153 (qa/auditoria-visual-e2e-v804) aberta e draft; não modificar sua branch. PR #100 de vídeo antiga também aberta. As demais branches listadas são históricas. Revalidar main antes da entrega; trabalho não enviado a main.

## Fonte do fluxo
Histórico mantém FE e dois adaptadores; não houve remoção do cálculo. Fonte anterior: B3 republicada por Dados de Mercado, valores em R$ milhões e atraso de cerca de dois pregões. Não apresentar como intradiário. HTML indisponível ou alterado deve manter último snapshot com aviso, nunca zeros artificiais.
