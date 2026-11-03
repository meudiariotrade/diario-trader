# v311 — correção das artes e da atualização

A publicação conferida em 02/11/2026 tinha os códigos da v310, mas não tinha a pasta cards-art. As quatro imagens retornavam HTTP 404. Por isso o card exibia Arte indisponível e o cache completo da nova versão não conseguia instalar.

## Correção

As artes agora estão incorporadas no arquivo cards-assets.js, na mesma pasta principal do app. O index.html carrega esse arquivo antes de cards-sazonais.js. O sw.js v311 usa o arquivo incorporado e não exige a pasta cards-art. O carregador mantém compatibilidade com os caminhos antigos quando o arquivo de artes não está presente. O aviso de falha passa a refletir somente o tema selecionado. Também foi verificado o controle de ocultar o ativo nas imagens e nos resumos.

## Como atualizar

Extraia o ZIP. Envie todos os arquivos de dentro de diario-trader-main para a pasta principal do repositório, onde já estão index.html e app.js. Não envie o ZIP sem extrair e não crie outra pasta diario-trader-main dentro do site. Todos os arquivos necessários à execução desta versão estão na pasta principal. O arquivo cards-assets.js é essencial: não o deixe de fora.

Após a publicação do GitHub Pages terminar, feche todas as janelas do app e reabra conectado à internet. Não é preciso apagar os dados do site ou reinstalar o aplicativo. Se o site ainda não mostra o seletor, aguarde a publicação e abra novamente.

Esta é uma atualização completa, incluindo todas as melhorias anteriores e dez estilos de cards. Não há alteração no Supabase e não há chamadas pagas de IA para gerar as imagens ao compartilhar. A correção foi preparada em ZIP; ainda precisa ser enviada ao repositório para entrar no site.

## Verificação

Testados os dez estilos usando exclusivamente as artes incorporadas, sem requisições à pasta cards-art. Testados calendário anual, falha e recuperação, sinais e percentuais, ocultação de dinheiro e ativos. Verificados PNGs incorporados e dependências do cache. Testes anteriores de terminal, panorama, layout e exportações executados novamente. Os arquivos publicados foram comparados com o pacote; os 404 foram observados na publicação anterior. Não houve alteração na conta ou nos registros do usuário.
