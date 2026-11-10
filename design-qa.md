# QA visual — Terminal v540

final result: passed

## Referência e escopo

Referência observada: `/workspace/terminal-v539/bloomberg-menu-reference.png` (1040 × 800), imagem real do menu Bloomberg publicada pela Brooklyn College Library: https://libguides.brooklyn.cuny.edu/Bloomberg/bloomberg-features . Foram também inspecionados os quadros públicos de prévia do vídeo oficial Welcome to the Terminal: `/workspace/terminal-v539/bloomberg-video-frame-20.png` e `bloomberg-video-frame-50.png`; vídeo em https://b.bloomberglp.com/welcome-to-terminal .

Implementação: `/workspace/terminal-v539/menu-implementado-1040.png`, conteúdo de 1040 × 959 CSS px, capturado em Chromium com viewport 1048 × 1100, deviceScaleFactor 1. Comparação conjunta real: `/workspace/terminal-v539/comparacao-design.png`. Ambas as imagens aparecem lado a lado com largura 1040 px, sem esticar ou desenhar a interface. A densidade original da referência não é informada; não foi inferida uma escala pixel a pixel.

Estado: Início do Terminal aberto, sem busca ativa. O conteúdo e os grupos são os do Diário, em português. A busca acima das listas e os seis grupos de tarefas são adaptações intencionais ao pedido de facilitar encontrar as funções. A marca geral do aplicativo permanece fora do menu. O escopo reproduz o padrão visual e de navegação, não os serviços nem o catálogo proprietário de dados Bloomberg.

## Achados e correções

- P1 anterior: menu acessível apenas por Painéis, em uma janela longa de botões. Correção: o Início do Terminal apresenta o diretório; o botão Menu retorna para ele. Evidência posterior: `menu-mobile-final.png` e `menu-implementado-1040.png`.
- P2 anterior: gráfico competia com Radar, Notícias, Agenda e Juros na mesma página. Correção: Gráficos ocupa a largura disponível; os dados e ferramentas continuam nos comandos existentes. Capturas: `depois-grafico-1440.png` e `depois-grafico-390.png`.
- P2 na primeira comparação: tipografia herdada monoespaçada e numeração com saltos devido às funções recolhidas. Correção: rótulos Arial, numeração contínua das funções principais e códigos secundários monoespaçados. A comparação conjunta posterior mostra os ajustes.
- P1 funcional encontrado na revisão: abrir um comando pela busca de teclado a partir do Início podia deixar o resultado escondido. Correção: a seleção de comando abre o modo Painéis. Teste cobre Ctrl+Espaço, ECO e a visibilidade do resultado.

## Superfícies de fidelidade

- Tipografia: títulos claros, rótulos legíveis em Arial e códigos monoespaçados; 14 px nos itens, 18–20 px no título. A referência usa texto maior, mas a densidade da captura original é desconhecida; tamanhos escolhidos para os controles e dimensões reais do aplicativo.
- Espaçamento: duas colunas no computador, uma no celular, linhas simples e sem cartões arredondados dentro do diretório. A imagem completa permite comparar composição; a captura móvel e a busca oferecem a inspeção focada de texto, quebra de linha e alvos de toque.
- Cores: fundo preto, funções âmbar, títulos brancos, códigos em azul claro; verde reservado à ação GO e às semânticas financeiras existentes. Controles dos gráficos e painéis recebem cantos discretos e superfícies escuras.
- Imagens: não há imagens decorativas no diretório implementado. A imagem e os quadros de Bloomberg são somente referências; não foram inseridos como fundo, interface rasterizada ou dados do aplicativo.
- Conteúdo: categorias em português e nomes por tarefa. O catálogo deriva dos comandos e controles reais. Funções adicionais ficam em Mais funções e na busca; não são inventados preços, dados ou funções Bloomberg indisponíveis.

## Interações e responsividade

Testes cobrem Início, Gráficos e Painéis em 320, 390, 1440 e 1920 px; ausência de transbordamento da página; linhas de pelo menos 44 px no celular; busca por assunto e comando; ECO e PETR4 G; abertura do controle nativo de planejar sessão; retorno pelo Menu; Ctrl+K e Ctrl+Espaço; preservação dos workspaces na navegação e das preferências do gráfico. Erros JavaScript são coletados nos testes de interface.

As capturas foram inspecionadas no navegador; build e verificação HTTP não foram usados como substitutos da conferência visual. Limite: revisão sem login, sem certificação de precisão de feeds ou acessibilidade completa com leitores de tela.

## Ajustes futuros de baixa prioridade

A busca pode receber novos sinônimos conforme os termos usados pelo usuário. Nenhum P0/P1/P2 permanece aberto no escopo descrito.

Compatibilidade adicional: preferências do comparativo antigo (T:HOME) são copiadas para Gráficos (T:GP) antes da inicialização do controlador somente quando esse contexto ainda não existe. O contexto antigo e qualquer configuração própria de Gráficos permanecem preservados. Teste de navegador cobre os dois cenários; suíte final com 31 testes aprovada.

## v541 — comandos limitados ao Terminal

Removidos do diretório e das buscas os adaptadores para outras telas e as funções de pesquisa em sobreposições. FLUXO não é reutilizado: o código colidia entre Fluxo EWZ e Times & Trades da ponte. Nenhum fluxo financeiro foi inventado nem substituído por outro. Comandos nativos como ECO, NEWSBR, DIFUT e HIST continuam nos painéis. O filtro também cobre aliases, favoritos e histórico; execução direta e os adaptadores legados de navegação são protegidos. Configuração de espaços e painéis permanece própria do Terminal; a navegação principal do aplicativo e as telas originais fora dele continuam funcionando.

Teste de navegador cobre os comandos retirados por digitação, APIs, aliases e busca, confirma que o ticker EWZ abre no painel, preserva os workspaces e verifica a tela original de fluxo fora do Terminal. A suíte completa passou com 32 testes.
