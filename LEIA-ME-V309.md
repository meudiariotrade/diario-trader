# Diário de Trader - v309: panorama criativo e cards sazonais

Esta versão inclui as melhorias anteriores e acrescenta artes originais aos compartilhamentos.

## O que mudou

- Topo do panorama com composição Brasil-EUA: São Paulo, arquitetura de Wall Street e touro, com identificação textual B3, NYSE e Nasdaq. A arte não representa vínculo com bolsas ou corretoras.
- Cards de operações e de período com novo formato 1080 x 1350, percentual em destaque, entrada e saída/referência, setup e data.
- Resultado em R removido das imagens compartilhadas, inclusive do melhor trade no resumo. Os cálculos e o uso de R no diário, estatísticas e PDFs permanecem preservados.
- Temas Mercado, Natal (Papai Noel no touro), Halloween (touro feiticeiro e abóboras) e Clássico.
- Seletor Estilo do card na janela de compartilhamento. A escolha fica guardada no dispositivo e pode ser alterada antes de salvar ou compartilhar.
- Automático usa o calendário atual em Brasília: Natal em dezembro, Halloween entre 15 e 31 de outubro e Mercado nos demais dias. A data da operação não muda essa escolha automática; para reproduzir outra época, escolha o tema manualmente.
- O resultado financeiro continua controlado pela caixa Mostrar o resultado em dinheiro. Ganhos e perdas usam as mesmas opções de arte; sinal e cores dos valores continuam explícitos. Operações abertas permanecem identificadas como referência.

## Instalação

Pode atualizar direto para v309. Envie o conteúdo de diario-trader-main à raiz do repositório, preservando os demais arquivos. É essencial enviar a pasta cards-art completa, além dos arquivos novos e alterados.

Novos: cards-sazonais.js e cards-art/mercados-brasil-eua.png, cards-art/natal-touro.png, cards-art/halloween-touro.png.
Alterados nesta revisão: index.html, sw.js, app.js, exports-profissionais.js, package.json e release.config.json. O cache v309 instala o conjunto completo; não envie apenas os scripts sem as imagens.

Não exige alteração no Supabase, troca de provedor de IA ou chave da OpenAI. As artes já estão incluídas; compartilhar não gera uma nova imagem por IA. O carregamento de uma arte usa cache local e tem limite de espera; se falhar, o card usa fundo simples e a janela informa a falha.

## Exemplos e Canva

A pasta amostras-v309 contém exemplos fictícios dos quatro estilos, um exemplo com dinheiro, um resumo de período e o panorama. O guia cards-guia-v309.html registra os três estilos ilustrados. Não são dados da conta do usuário.

Guia no Canva: https://www.canva.com/d/DJcXJKnH-pf2gRe

## Validação

- Calendário de Brasília, incluindo a mudança de dia entre UTC e Brasil.
- Escolha manual, rejeição de tema inválido, persistência local e recuperação após falha de imagem.
- Privacidade com valores financeiros desmarcados/marcados, ausência de R nos cards, sinal negativo preservado e dados de entrada intactos.
- Inclusão das três artes e do script no HTML/cache.
- Testes anteriores de Terminal, pré-abertura, design e exportações repetidos.
- Amostras renderizadas a partir dos comandos Canvas do código para conferência. A revisão no Safari/iPhone com a sessão real continua pendente. As fontes do sistema podem apresentar diferenças de medidas.

Comandos: node tests/cards-v309.cjs; node tests/exports-v308.cjs; node tests/design-v307.cjs; node tests/terminal-v306.cjs; node tests/panorama-v306.cjs. Para reconstruir os PNGs de demonstração: node qa-v309/gerar-cards.cjs e python3 qa-v309/render-cards.py.

O pacote foi preparado localmente. Não foi publicado no GitHub nem criada outra cópia hospedada do aplicativo.
