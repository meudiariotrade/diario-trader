# Diário de Trader — v310: coleção de cards

Inclui todas as melhorias das versões anteriores. Pode atualizar diretamente para a v310.

## Novos temas

Carnaval, Futebol, Páscoa, Festa Junina, Verão e Réveillon. Continuam disponíveis Mercado, Natal, Halloween e Clássico, totalizando dez estilos mais o modo Automático.

O seletor Estilo do card está na janela de compartilhamento de operações e resumos por período. A escolha fica salva neste dispositivo. A lista é compacta e tem rolagem; os temas aparecem também quando não é sua época.

## Calendário automático (horário de Brasília)

A época é a data atual do compartilhamento, não a data da operação.

| Tema | Período |
| --- | --- |
| Réveillon | 26 de dezembro a 6 de janeiro |
| Natal | 1 a 25 de dezembro |
| Halloween | 15 a 31 de outubro |
| Carnaval | Sexta-feira antes do Carnaval até Quarta-feira de Cinzas |
| Páscoa | Domingo de Ramos até Domingo de Páscoa |
| Festa Junina | Todo o mês de junho |
| Verão | 7 de janeiro a 20 de março, com prioridade para Carnaval/Páscoa |
| Mercado | Demais datas |
| Futebol e Clássico | Seleção manual, disponível o ano todo |

Carnaval e Páscoa são calculados pelo calendário gregoriano para cada ano, sem chamadas externas. A janela Verão é uma regra visual fixa, sem pretender indicar o horário astronômico da mudança de estação. Futebol não depende de calendário de partidas ou de clube.

## Dados e privacidade

A arte é decorativa. Percentual, preços, setup, datas e dinheiro continuam desenhados pelo código com os registros do diário. Sem resultado em R nas imagens. O controle de mostrar dinheiro continua funcionando. Ganhos e perdas têm o mesmo acesso aos temas; o sinal e as cores acompanham os valores reais. Operações abertas continuam identificadas como referência. Os exemplos em amostras-v310 usam dados fictícios.

## Instalação

1. Faça seu backup habitual dos registros.
2. Extraia o ZIP e envie todo o conteúdo da pasta diario-trader-main ao mesmo local do aplicativo, incluindo a pasta cards-art e o sw.js.
3. Após publicar, feche e reabra o aplicativo conectado à internet para receber o cache v310. Não é necessário instalar versões intermediárias.
4. Abra uma operação ou resumo, toque para compartilhar e escolha Estilo do card.

O pacote foi preparado, mas não foi publicado no GitHub. Não houve alteração no Supabase.

## Artes

Artes geradas com a ferramenta integrada de criação de imagem, sem consumo de API ao usar o aplicativo. Não há chave OpenAI para configurar. Os seis novos temas usam cards-art/colecao-sazonal.png, uma única imagem com seis regiões. O Canvas recorta cada região ao renderizar, sem editar a arte original. A carga da coleção é compartilhada e os arquivos estão no cache offline. Se uma arte falhar, o card usa fundo simples e conserva os dados.

Brief de geração: atlas 3 colunas por 2 linhas, cada região em retrato 4:5, cenas distintas de Carnaval (máscara e fitas), Futebol (bola e troféu), Páscoa (coelho e ovo de chocolate), Festa Junina (lanterna e chapéu), Verão (coco e óculos) e Réveillon (relógio e fogos). Fundo azul-marinho com área livre à esquerda, sujeitos à direita, sem texto, números, touros ou marcas.

## Verificação

Testados dez estilos com dados de referência, privacidade financeira, ausência de R, carga única da coleção, recortes e recuperação de falha. Calendário testado com feriados móveis 2026–2028 e limites de data em Brasília. As amostras foram geradas a partir das operações do Canvas e inspecionadas visualmente; não são capturas de Safari. Os testes anteriores de terminal, panorama, design e exportação foram executados novamente. Validação final no iPhone com uma sessão real continua pendente.
