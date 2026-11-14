# CLAUDE.md — Regras de Arquitetura e Design System (Diário de Trader)

## 1. Identidade Visual e Estética (Anti-AI Slop)
Este aplicativo é uma ferramenta profissional de mesa proprietária e gestão de risco. Abandone qualquer estética de template genérico:
- **Superfícies Planas (Flat High-Density):** Nunca crie cartões com bordas dentro de outros cartões com bordas. Separe blocos de informação usando diferença sutil de fundo e linhas divisórias finas (`1px solid #1E232E`).
- **Paleta de Cores Institucional:**
  - Fundo Base (Background): `#0A0C10`
  - Superfície de Painéis/Cards: `#11141B`
  - Superfície Hover/Ativa: `#181C26`
  - Bordas e Divisórias: `#1E232E`
  - Destaque Institucional (Âmbar/Ouro): `#D4A017`
  - Gain / Positivo: `#10B981`
  - Loss / Risco Crítico: `#EF4444`
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
- **Commits:** Faça commits atômicos, claros e descritivos em português, listando os arquivos modificados.

## 6. Regra de Tela Única (Zero Sobreposição)
- Nunca mantenha múltiplas abas montadas no DOM simultaneamente usando CSS. Use sempre desmontagem completa (unmount) na troca de rota/aba e mantenha o Ticker, Header e BottomNav exclusivamente no layout raiz.
- Antes de alterar telas, me mostre quais arquivos duplicados/zumbis você encontrou e onde estava o erro de sobreposição de telas, e já aplique o commit da limpeza.

## 7. Responsividade Desktop (md: / lg:)
- **Proibido colunas estreitas que quebrem palavras verticalmente:** nenhum grid ou flex pode encolher um card a ponto de quebrar texto letra por letra. No desktop use `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5` (sub-cards `grid-cols-1 sm:grid-cols-2`), `min-w-0` nos filhos de grid/flex e `break-normal` / `whitespace-nowrap` em rótulos curtos, tickers e valores. Nunca aninhe grids de colunas fixas dentro de colunas já estreitas.
- **Largura do monitor:** Início e Meu dia usam `w-full max-w-7xl mx-auto px-6` no desktop; não trave os containers principais em `max-w-md` / `max-w-lg`.
- **Sidebar retrátil obrigatória no Desktop:** o menu lateral precisa ter botão de recolher/expandir (« / ») ao lado de "Diário de Trader"; recolhido vira barra de 64px só com ícones centralizados e tooltip, com a preferência salva no localStorage. O layout mobile (iPhone) não pode mudar ao ajustar o desktop.
