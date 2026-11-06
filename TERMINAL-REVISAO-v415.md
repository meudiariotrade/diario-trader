# Diário de Trader v415 — Terminal integrado, gráficos em linha

**Origem:** base v414, sem alterar tabelas, rotinas de importação do Profit, carteira, diário, Mercado, Settings ou Edge Functions.

## Navegação consolidada

- Terminal abre por padrão na visão principal (comparativo, Radar Global, Notícias, Agenda e Juros).
- Barra única no Terminal: Visão geral, Gráficos, Radar Global, Fluxo, Notícias, Juros, Agenda e Painéis/Workspaces.
- Subpainéis usam os comandos originais `IBOV G`, `GLOBAL`, `MON`, `NEWSBR`, `DIFUT`, `ECO` do Terminal; nenhuma fonte ou módulo foi duplicado.
- Visão principal não é uma aba externa do aplicativo. Navegar dentro do Terminal mantém o cabeçalho; retorna pelo botão Visão geral.
- Workspaces clássicos preservados, inclusive layouts salvos, comandos, exportação, pesquisa, indicadores e gerenciamento de painéis.

## Gráficos Bloomberg-like

- GP/GIP passam a mostrar curva de fechamento e preenchimento discreto como opção **Linha** padrão.
- Controle **Candles** continua disponível; OHLC de origem, indicadores SMA/RSI/MACD, alertas, zoom, preço e comparação não foram alterados.
- O comparativo da Visão geral já desenhava linhas branca e azul em base 100 e foi mantido.
- Nenhum histórico foi fabricado. Testes reais dependem do login, da fonte de candles e do período disponível.

## Testes neste ambiente

- Chromium 390px e 1440px: painel principal, 8 caminhos da navegação e retorno, opção Workspaces e reentrada no Terminal após acessar Mercado; nenhum erro de JavaScript nos cenários locais.
- Modo gráfico Linha/Candles: alternância validada e renderer SVG testado com série **sintética apenas no teste isolado**, fora da aplicação.
- Código: `node --check` dos arquivos JS modificados.

## Pendente no ambiente do usuário

- Testar com sessão autenticada no Safari/iPhone e Profit Pro; dados de cotações e gráficos não ficam disponíveis no teste sem login.
- A correspondência pixel a pixel com Figma é aproximada pela imagem fornecida (não houve acesso às camadas editáveis do design).
- Publicação no GitHub não realizada.
