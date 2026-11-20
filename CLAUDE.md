# CLAUDE.md — Regras de Arquitetura e Design System (Diário de Trader)

## 1. Identidade Visual e Estética (Anti-AI Slop)
Este aplicativo é uma ferramenta profissional de mesa proprietária e gestão de risco. Abandone qualquer estética de template genérico:
- **Superfícies Planas (Flat High-Density):** Nunca crie cartões com bordas dentro de outros cartões com bordas. Separe blocos de informação usando diferença sutil de fundo e linhas divisórias finas (`1px solid #1E232E`).
- **Paleta de Cores Institucional (v828, escuro — todas as abas menos o Terminal):**
  - Fundo Base: `#08090D`
  - Sidebar, Topbar e Ticker: `#0C0E14`
  - Cards principais: `#12151E` com borda `1px solid rgba(255,255,255,0.06)`
  - Sub-cards e Hover: `#181C28`
  - Destaque (Âmbar) — só no CTA principal, indicador da aba ativa e micro-detalhes: `#F59E0B`
  - Texto: números principais `#FFFFFF`, títulos `#E2E8F0`, rótulos `#64748B`
  - Gain / Positivo: `#10B981` · Loss / Risco Crítico: `#EF4444` (só para variações financeiras)
  - Tokens no código: `--ui-*` (src/app-theme.css); componentes base em `src/shared/ui-base.js` (DiarioUI).
  - **Terminal:** mantém a paleta original (`#0A0C10`, `#11141B`, `#181C26`, `#1E232E`, `#D4A017`) e não deve ser alterado.
- **Geometria:** Utilize `border-radius` máximo de `4px` ou `6px`. Mantenha paddings compactos para alta densidade de dados sem rolagem excessiva.
- **Proibições Estritas:**
  - NUNCA use botões flutuantes (FAB) cobrindo conteúdo na tela.
  - NUNCA use gradientes neon, sombras pesadas (`box-shadow`) ou imagens genéricas de candles como placeholder.
  - NUNCA exiba textos vazios como "Sem preço ainda"; use sempre o último fechamento salvo no banco acompanhado da badge `FECHADO`.

## 2. Tipografia Financeira e Alinhamento
- **Números Tabulares:** Todo e qualquer dado numérico (preços, R$, porcentagens, horários, strikes, contagem regressiva) DEVE usar `font-variant-numeric: tabular-nums` para evitar deslocamento horizontal durante atualizações.
- **Alinhamento:** Valores financeiros em tabelas e listas devem ser alinhados à direita. Títulos de cabeçalho devem ser sempre alinhados à esquerda.
- **Badges Padronizadas:** Opções devem exibir tags compactas (`CALL` em verde-escuro translúcido, `PUT` em vermelho-escuro translúcido) sem cortar textos com reticências (`...`).

## 3. Experiência Mobile (iOS / PWA)
- **Safe Areas:** Respeite sempre `env(safe-area-inset-top)` no ticker superior e `env(safe-area-inset-bottom)` na barra de navegação inferior para evitar sobreposição com os controles nativos do iPhone.
- **Área de Toque:** Botões interativos, checkboxes e seletores de estado emocional devem ter altura mínima de `40px` a `44px` para uso rápido com uma mão.
- **Prevenção de Zoom Automático:** Campos de input (como a busca do Terminal `PETR4 G`) devem ter `font-size: 16px` no mobile para impedir que o Safari/iOS dê zoom forçado na tela ao tocar.

## 4. Regras de UX Operacional (Rotina do Trader)
- **Checklist Contextual:** Nunca exiba o total acumulado de regras (ex: "0 de 54") como foco principal. Filtre automaticamente pelo horário local:
  - Antes das 09:00: Foco exclusivo no **Pré-mercado** + cronômetro regressivo para abertura.
  - Entre 09:00 e 17:00: Foco nas regras **Durante o pregão** e monitoramento de risco aberto.
  - Após 17:00: Foco no **Pós-mercado** (importação do Profit e fechamento do dia).
- **Gestão de Risco:** Indicadores de risco consumido/disponível devem sempre vir acompanhados de barras visuais dinâmicas (Verde <= 50%, Âmbar 51-80%, Vermelho > 80%).

## 5. Padrões de Código, GitHub e Supabase (Segurança Crítica)
- **Proteção de Dados:** NUNCA execute comandos destrutivos (`DROP`, `TRUNCATE`, `DELETE` sem filtro) no Supabase. Toda alteração de schema deve ser feita via migrations aditivas (`ADD COLUMN`, `CREATE TABLE IF NOT EXISTS`).
- **Segurança (RLS):** Garanta que qualquer nova tabela criada tenha Row Level Security (RLS) ativado e políticas vinculadas ao `auth.uid()`.
- **Preservação de Lógica:** Ao refatorar componentes de UI, preserve integralmente hooks, estados, integrações com o Profit, comandos do Terminal e consultas existentes.
- **Cota de Log Query — proibição absoluta:** É **PROIBIDO consultar, pesquisar, exportar ou executar qualquer query** nas tabelas, datasets, endpoints, APIs ou painéis de **Logs / Analytics do Supabase**, inclusive **Log Explorer / Log Query**, logs de Edge Functions, API, Auth, Postgres e Realtime, seja pelo Dashboard, MCP, SQL, SDK, CLI ou outras ferramentas. **Não execute nem mesmo uma consulta de teste, contagem, diagnóstico ou inspeção de logs.** A cota de Log Query deve ser preservada (referência informada pelo usuário: **85,3 GB de 100 GB**; esse número não autoriza qualquer consulta de atualização).
- **Alternativas para diagnóstico sem Log Query:** Inspecione código e arquivos do repositório, resultados e artefatos do GitHub Actions/CI, testes locais, respostas diretas de endpoints de saúde e, quando estritamente necessário, tabelas operacionais comuns do projeto **que não sejam logs ou Analytics**. Nunca use logs como atalho para investigar bugs, deploy, falhas de Edge Functions ou consumo do Supabase. Não altere configurações de logging sem autorização específica do usuário.
- **Commits:** Faça commits atômicos, claros e descritivos em português, listando os arquivos modificados.

## 6. Regra de Tela Única (Zero Sobreposição)
- Nunca mantenha múltiplas abas montadas no DOM simultaneamente usando CSS. Use sempre desmontagem completa (unmount) na troca de rota/aba e mantenha o Ticker, Header e BottomNav exclusivamente no layout raiz.
- Antes de alterar telas, me mostre quais arquivos duplicados/zumbis você encontrou e onde estava o erro de sobreposição de telas, e já aplique o commit da limpeza.

## 7. Responsividade Desktop (md: / lg:)
- **Proibido colunas estreitas que quebrem palavras verticalmente:** nenhum grid ou flex pode encolher um card a ponto de quebrar texto letra por letra. No desktop use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5` (sub-cards `grid-cols-1 sm:grid-cols-2`), `min-w-0` nos filhos de grid/flex e `break-normal` / `whitespace-nowrap` em rótulos curtos, tickers e valores. Nunca aninhe grids de colunas fixas dentro de colunas já estreitas.
- **Largura do monitor:** Início e Meu dia usam `w-full max-w-none` no desktop, o mesmo padrão das outras abas (preenchem a área útil inteira); não trave os containers principais em `max-w-*`.
- **Sidebar retrátil obrigatória no Desktop:** o menu lateral precisa ter botão de recolher/expandir (« / ») ao lado de "Diário de Trader"; recolhido vira barra de 64px só com ícones centralizados e tooltip, com a preferência salva no localStorage. O layout mobile (iPhone) não pode mudar ao ajustar o desktop.

## 8. Regra de Ouro de Infraestrutura: Divisão de Carga e Proteção do Supabase (Free Plan)

**Obrigatória para todas as implementações, refatorações, auditorias e rotinas futuras.** Priorize a economia de Egress, Log Query, CPU, armazenamento e requisições do Supabase Free Plan, sem comprometer segurança, integridade ou confiabilidade dos dados.

### 8.1. Divisão Máxima de Carga (Arquitetura Distribuída)
- **Cloudflare — Borda / Workers / KV / R2:** Deve absorver o tráfego de **leitura pública**, incluindo proxies autorizados de APIs externas (Yahoo Finance, SEC EDGAR, CVM, Finnhub, Binance), geração/distribuição de snapshots pré-computados, cache HTTP compartilhado e respostas públicas reutilizáveis. Configurar TTL, ETag, deduplicação e política de cache verificável (por exemplo, `CF-Cache-Status: HIT` quando aplicável). Respeitar autenticação dos provedores, licenças, rate limits e políticas de atualização. **Jamais armazenar em cache público dados privados, tokens ou respostas personalizadas do usuário.**
- **Dispositivo do usuário — Client-Side / Web Workers / IndexedDB:** Deve executar **100% dos cálculos pesados** de análise, tais como indicadores técnicos, Fibonaccing, Ondas de Elliott, filtros, ordenações, classificações locais e renderização de gráficos/PDFs via Canvas. Manter snapshots no dispositivo, com TTL, ETag, invalidação por versão e limpeza de caches obsoletos. Usar Web Workers quando necessário para manter a interface responsiva; não transferir cálculos pesados ou atualizações em segundos para o Supabase.
- **Supabase — Núcleo Enxuto:** Restringir a **Auth**, persistência transacional mínima e segura (**Bulk Upsert** em lotes otimizados) e armazenamento de dados privados do usuário (Carteira, Operações, Diário e registros pessoais autorizados). Preservar RLS, transações, controle de acesso e integridade. **Proibido** utilizá-lo como motor de buscas públicas em tempo real, proxy de cotações, computação pesada sob demanda por requisição, polling frequente ou origem de snapshots públicos consultados em segundos.

### 8.2. Proibição de Consultas Pesadas de Log (Log Query)
- **É expressamente proibido executar qualquer consulta, varredura, busca, contagem, exportação ou inspeção nos Logs / Analytics do Supabase**, inclusive `edge_logs`, `postgres_logs`, Log Explorer, Log Query, logs de Auth, API, Realtime e Edge Functions — **mesmo que a consulta seja pequena ou pareça inofensiva**. A proibição vale para Dashboard, SQL, MCP, SDK, CLI, API e ferramentas automatizadas e complementa a regra absoluta da seção 5.
- Durante auditorias e diagnósticos, utilizar inspeção de código, testes locais, resultados do GitHub Actions/CI e respostas diretas de endpoints de saúde sem consulta a logs/analytics. **Não consultar o consumo atualizado de Log Query por meio desses serviços.**

### 8.3. Zero Polling e Limpeza de Recursos
- **Proibido** criar `setInterval`, `setTimeout` recursivo, loops contínuos, assinaturas sem controle ou qualquer polling de tabelas, RPCs e Edge Functions do Supabase para dados de mercado ou atualizações de interface.
- Toda atualização pública recorrente deve preferir **Cloudflare + cache compartilhado**; no cliente, usar cache local e atualização por evento, ação explícita ou ciclo de vida com limitação de frequência, quando necessário, sem sobrecarregar o Supabase.
- **Ao sair/desmontar uma aba**, encerrar imediatamente timers e Web Workers exclusivos da aba, cancelar `fetch`/requisições pendentes com `AbortController`, remover listeners e desinscrever subscriptions. Não deixar tarefas ou conexões órfãs em segundo plano.
- Antes de qualquer alteração de infraestrutura, verificar se o novo fluxo reduz consultas e transferência de dados, preserva funcionalidades atuais e não reintroduz Egress ou Log Query elevados.

