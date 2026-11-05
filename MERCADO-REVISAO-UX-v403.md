# Revisão UX — Mercado v403 (Figma)

## Diretriz
A tela Mercado é consulta e inteligência, não envio de ordens. A referência aprovada contém: faixa móvel de cotações, categorias em chips, busca, ordenação, alternância lista/mapa, gráfico comparativo e tabela com logos, preços e variações.

## Implementado nesta etapa
- Navegação principal nas subáreas Cotações, Panorama, Notícias, Agenda, Análises e Jornal, sem repetir Alertas. A função de alertas por preço e o gerenciamento nas Configurações são preservados.
- Cotações: lista existente integrada à nova apresentação; filtros, pesquisa, favoritos, alertas, atualização e mapa de calor continuam associados aos handlers originais.
- Gráfico comparativo: visual escuro, base 100, escolha de índices, períodos e expansão, com *exclusivamente* candles diários disponíveis no Terminal. Não desenha curvas inventadas quando não há duas séries nas mesmas datas.
- Áreas internas: tipografia, cores, campos, filtros e botões padronizados com contraste alto, sem retângulos brancos ilegíveis.
- Desktop: largura responsiva, tabela de cotações em linha única; iPhone: barra horizontal rolável sem duplicar a navegação inferior.

## Verificações posteriores (requerem dados da conta e Safari real)
- Confirmar atualização das cotações no ambiente online e indicadores de horário/fonte de cada ativo.
- Verificar datafeed de candles SPX/NDX; caso não estejam carregados, ligar a mesma API de histórico já utilizada pelos gráficos do Terminal à comparação.
- Testar pesquisas, favoritos e alertas salvando e sincronizando no Supabase; os testes offline não verificam o servidor.
- Avaliar os cards internos do Panorama, Jornal, Análises e Agenda com dados reais e conferir carregamento do widget TradingView.
- Comparação pixel a pixel final depende de acesso à tela original editável do Figma. O plugin atingiu limite de chamadas do plano durante a revisão, portanto o arquivo Figma gerado ainda não foi editado.

## Observação
O pacote NÃO altera schemas, políticas de segurança, funções do Supabase, a ponte Profit nem os cálculos de risco. Histórico, cotações, notícias e agenda são exibidos somente quando há dados de fontes conectadas.
