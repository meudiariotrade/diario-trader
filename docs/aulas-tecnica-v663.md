# Análise Técnica na Prática — v663

Alteração aditiva exclusivamente em Estudos > Aulas. As fontes novas estão em `src/studies/tecnica-*.js` e são agregadas em `src/app-layers.js`, que gera `camadas-v560.js`. Aulas prévias, Biblioteca, Treino & Progresso, Replay e Supabase não foram editados.

18 lições, quatro módulos, 72 etapas e 54 questões com feedback. Progresso guardado no navegador e separado por conta; conclusão exige quatro etapas vistas e três acertos. Os exemplos são diagramas autorais hipotéticos: os PDFs privados dos livros não estavam disponíveis e não se afirma reprodução de exemplos históricos ou páginas dos autores.

## Avatar e publicação

- `public/avatar-mentor.png`: imagem fornecida pelo usuário, convertida para PNG.
- `public/avatar-mentor-chart.png`: segundo cenário gerado preservando o personagem da referência, apontando para um monitor. O gráfico decorativo da imagem não é o diagrama didático, que é SVG e tem coordenadas verificáveis.
- `public/avatar-talking.mp4`: opcional, ainda não fornecido. Ao adicionar o arquivo, o build o publica automaticamente. Reproduz mudo, em loop, apenas durante a fala; erro/autoplay recusado mantém a imagem.
- O build publica o conteúdo de `public/` na raiz de `_site/`. URLs relativas preservam o funcionamento do GitHub Pages em subdiretórios. O modo canto reserva uma faixa lateral no desktop; no celular, o mentor ocupa espaço próprio para não cobrir controles.

## Ponte Vídeo

O pacote `ponte-video.zip` fornecido pelo usuário revelou o contrato real: worker Python no Windows que consulta as aulas prontas, gera narração edge-tts, captura cenas com Playwright, monta o MP4 com FFmpeg e envia ao bucket privado existente `aulas-videos`. Não há servidor HTTP, endereço local ou porta para descobrir. Não é possível confirmar daqui se o processo está ativo no PC.

`bridge-video/` preserva o gerador antigo e adiciona `tecnica_video.py`: 18 lições distribuídas em manifesto estático, gráficos SVG idênticos aos da trilha, abertura no estúdio e quatro etapas com mentor no cenário do gráfico, voz neural e legendas por palavra. Não cria registros na tabela `aulas`. O gerador de manifesto é `scripts/export-tecnica.cjs`, executado pelo build. O pacote da ponte inclui as imagens e o manifesto públicos, sem `config.json`, senha ou sessão. Os vídeos usam `<uid>/tecnica-v1-<slug>-<formato>.mp4`, dentro da pasta privada da conta. A consulta de vídeos no app renova a sessão pelo mecanismo já existente, cria acesso temporário e descarta respostas após troca de conta/aba/lição.

O modo automático da ponte passa a processar a trilha após as aulas antigas. O histórico da trilha é separado por conta, conteúdo, formato e voz; só marca sucesso após upload. Falhas de envio reaproveitam o MP4 local no próximo ciclo. No Windows é necessário fechar a ponte antiga, copiar a atualização sobre a pasta existente preservando `config.json` e abrir `RETOMAR PONTE.bat`. `GERAR AULA DA TRILHA.bat` permite testar uma única lição.

O painel das aulas não solicita endpoint. O adaptador opcional de áudio HTTP permanece internamente para compatibilidade, mas não corresponde a esta ponte. Na trilha interativa, Ouvir Aula usa voz nativa enquanto os MP4 da ponte têm narração neural. Não foi implementada sincronização labial nem criado um MP4 de gestos do avatar.

Cada etapa avança somente ao término do respectivo áudio ou utterance; não há temporização estimada. Pausar cancela e permite reiniciar a etapa. Trocar de lição, sair da aba, trocar de conta ou ocultar a página cancela áudio e pedidos pendentes.

## Referências conceituais

Flávio Lemos, John Murphy, Al Brooks e Thomas Bulkowski são referências conceituais solicitadas. Regras de figuras e indicadores conferidas em fontes primárias públicas:

- https://thepatternsite.com/measure.html
- https://thepatternsite.com/hsb.html
- https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/overview

Os períodos 20, 50 e 200 são convenções de mercado, não uma regra universal institucional. A contagem sempre usa barras do período selecionado. As projeções geométricas não substituem estatísticas nem garantem resultados.

## Validação

Testes de conteúdo, cálculos, persistência por conta, respostas erradas/corretas, conclusão, mudança de aba, cancelamento, erros de assets, resposta atrasada e sucesso/falha da ponte simulada em `tests/tecnica-aulas.test.cjs`. Teste integrado de navegação e responsividade em `tests/tecnica-aulas-browser.test.cjs`. Pipeline padrão executa `npm run verify` e `npm run build` antes de publicar.

A validação local passou em testes de conteúdo, vídeo privado, isolamento de conta, respostas atrasadas, manifesto, repetição de envio e histórico. O Chromium local não inicia por bloqueio de sockets do ambiente: testes visuais integrados e geração real voz/FFmpeg/upload no Windows permanecem pendentes. Bucket privado e políticas por pasta de usuário foram conferidos por consultas somente leitura, sem alteração de banco.
