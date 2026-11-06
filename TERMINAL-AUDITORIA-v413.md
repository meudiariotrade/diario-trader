# Auditoria funcional do Terminal — v413

**Escopo:** Terminal atual, com referência visual fornecida pelo usuário (Figma) e princípios do Bloomberg Launchpad. **Regra permanente:** exclusivamente consulta e inteligência de mercado; operações continuam no Profit Pro.

## A. O que o aplicativo já tem — preservar, não recriar

### 1. Mercado e ativos (comandos internos)

- `WEI` Bolsas do mundo / índices internacionais;
- `FX`/`WCRS` moedas (WCRS já é alias de FX);
- `CMDTY`/`GLCO` commodities (GLCO já é alias de CMDTY);
- `CRYP` cripto;
- `MON` monitor e dados recebidos pelo Profit;
- `ADR` ADRs brasileiras;
- `MOST` maiores negociações, altas e baixas;
- `IMAP` mapa de calor;
- `EQS` filtros/screener de empresas;
- `PORT` carteira consultiva.

### 2. Macroeconomia, eventos e notícias

- `ECO` agenda com divulgações;
- `BTMM` juros e mercado monetário;
- `ECST`, `ECFC`, `CENB` indicadores, Focus e bancos centrais;
- `WIRP`, `GC`, `DIFUT` Copom/Fed, curva de juros/DI;
- `TD`/`YAS` Tesouro Direto e calculadora (YAS já é alias);
- `TOP`, `FIRST`, `N`, `NI`, `NEWSBR`, `NEWSUS` notícias filtradas e por ativo.

### 3. Análise, acompanhamento e IA

- `Q`, `DES` cotação e ficha de empresa;
- `GP`, `GIP` gráficos diário e intradiário; com zoom, navegação e indicadores existentes;
- `FA`, `ANR`, `EE`/`ERN`, `RV`, `DVD`, `TRAN` fundamentos, balanços, expectativas, pares e dividendos; EE e ERN são aliases;
- `OMON`, `OV`, `GRADE` opções, grade e cálculo;
- `ALRT` alertas de preço;
- `ASKB`, `BI` inteligência e análise setorial;
- `BTST`, `REPLAY`, `JORNAL` backtest, replay e Jornal;
- `GLOBAL` radar integrado, `DIFUT` curva DI e painéis com origem/atraso da fonte.

### 4. Operação do Terminal (ferramentas, não funções financeiras novas)

- Workspaces com layouts salvos e restauráveis, presets (Abertura, Brasil, EUA, Macro), reorganização e redimensionamento no PC;
- menu pesquisável, favoritos, histórico e comandos por ticker; alternância para outra janela;
- zoom gráfico, extensão para múltiplos ativos, dados de Profit, Finnhub, TradingView e fonte de candles;
- Data Center / indicador de qualidade e atualização das fontes;
- exportação CSV e atalhos de teclado.

## B. O que foi adicionado na v413 — somente camada de apresentação

1. **Visão geral Figma (nova capa do Terminal)** com gráfico real comparativo e quatro cartões compactos: Radar Global, Notícias, Agenda e Juros.
2. **Reuso de dados:** os quatro cartões consultam os caches e rotinas do Terminal existentes (`GLOBAL`, `DIFUT`, `NEWSBR`, `ECO`). Não foram criadas tabelas, Edge Functions, novas fontes nem cópias de rotinas de balanços, notícias ou juros.
3. **Acesso 1 clique ao módulo verdadeiro** pelo chevron em cada cartão, e botão **Painéis e Workspaces** para recuperar integralmente o Terminal existente.
4. **Gráfico:** mesmo mecanismo `window.TRM.tec.pegaVelas`/`velas` da versão atual. Apenas desenho e comparação base-100 da nova capa são próprios; nenhum dado financeiro é simulado na aplicação.
5. **PC:** gráfico em coluna grande; os quatro cartões em grade à direita, com cabeçalho responsivo. **Celular:** gráfico e grade 2×2, como a referência.
6. **Estabilidade:** a nova capa é reaproveitada durante renderizações globais (desanexa/reanexa antes da pintura) para minimizar mudanças de altura e a perda de rolagem.

## C. O que não foi duplicado

| Nova apresentação | Função real reutilizada |
|---|---|
| Radar Global | `GLOBAL`/`cot`/`melhorPx` e ponte Profit |
| Notícias do dia | `NEWSBR` / `noticias` e notícias por ticker |
| Agenda | `ECO` / `agenda` |
| Juros | `DIFUT` / `copom` |
| Comparativo | `tec.velas`/`tec.pegaVelas` existentes |
| Pesquisa e Workspaces | comando original `trcmd`, `roda` e seletor existente |

## D. Referências e limites

- Figma: o layout principal foi reconstruído usando a captura enviada. A leitura das camadas pelo conector Figma encontrou o limite de chamadas da conta Starter, portanto a correspondência **não é validada pixel a pixel no arquivo Figma**.
- Bloomberg: ideias de Launchpad (painéis independentes, workspace customizável, monitorização interligada, gráficos, notícias e alertas), conforme páginas oficiais da Bloomberg Professional. **Não usa conexão, dados, marca ou serviços proprietários Bloomberg**.
- Todos os números mostrados nas capturas de prévia foram **simulados somente no arquivo isolado de QA** e não estão dentro de `terminal-v413.js`.
- Não foram modificados Supabase, carteira, operações, Alertas, Diário, nem scripts das rotinas do Terminal existentes.
- Teste local realizado em Chromium com HTML isolado; Safari real e a resposta das suas fontes online ainda precisam de validação após publicação.
