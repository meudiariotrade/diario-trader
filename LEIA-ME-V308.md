# Diário de Trader - revisão geral v308

A revisão estende o padrão visual da v307 para áreas internas, PDFs e imagens de compartilhamento. A implementação está neste pacote. Ainda não foi publicada no GitHub nem ensaiada com a sessão real do usuário no iPhone.

## Instalação

Extraia o ZIP e envie o conteúdo da pasta diario-trader-main à raiz do repositório do aplicativo, preservando os arquivos existentes. Acrescente exports-profissionais.js, plataforma-acabamento.js e plataforma-acabamento.css. Atualize também app.js, index.html, sw.js, pdf-tabelas.js, carteira-factsheet.js, trader-relatorios.js, package.json e release.config.json.

O cache v308 instala os arquivos essenciais como um conjunto. Evite enviar somente o CSS. Os arquivos de amostras-v308 e os scripts qa-v308 são referências/testes; o aplicativo não os usa como cotações ou dados pessoais.

Não exige migração do Supabase, troca de provedor de IA ou geração de análises pagas. As fontes e as fórmulas existentes permanecem nos módulos originais.

## Mapa da revisão

| Área | Alteração | Verificação |
| --- | --- | --- |
| Abertura e início | Mantidos os ajustes da v307, com marca original, atalhos e rotina | Testes da v307 repetidos |
| Carteiras e pesquisa | Paleta, hierarquia, campos, cartões, tabelas e estados sem dados | Camada comum e rotas conferidas; ensaio visual por tela no iPhone pendente |
| Diário, operações, risco e estudos | Cabeçalho de área, abas existentes, formulários e acabamento compartilhado | Testes de montagem/navegação; preferências e registros preservados |
| Jornal e revista | Tipografia, cartões e tabelas alinhados ao aplicativo | Revista PDF de 3 páginas gerada/renderizada com dados fictícios |
| Menus e navegação | Menus sólidos; ajuste da barra inferior real #bnav e do botão central | Seletores conferidos no código; teste de toque no iPhone pendente |
| PDFs vetoriais | Paleta, fontes incorporadas, capas, identificação, referências e paginação | Análise (2 páginas), carteira (5) e revista (3), total de 10 páginas renderizadas |
| Tabelas PDF | Corpo mínimo de 8,5 pt, cabeçalhos repetidos e divisão de conteúdo longo | Tabela de estresse paginada em 14 páginas |
| PDF por captura HTML | Identificação nas páginas e margens reservadas | Gancho e contrato conferidos; captura no navegador real pendente |
| Panorama compartilhado | Cabeçalho sóbrio, estimativa após ADRs, fontes preservadas e redução de área vazia | Renderizador exercitado; teste da v306 repetido |
| Operação e período | Templates novos, fonte legível, hierarquia e números alinhados | Privacidade com/sem resultado financeiro, estado de demonstração e campos ausentes verificados |
| Ranking, giro e jornal compartilhados | Cabeçalhos institucionais, paleta e remoção de fotografia decorativa | Três renderizadores exercitados com conteúdo fictício |
| Dashboard compartilhado | Moldura de identificação preservando o conteúdo da tela | Gancho conferido; captura HTML no navegador real pendente |

Os exemplos de imagem foram reconstruídos a partir dos comandos Canvas do código de exportação, com fontes locais, para conferência determinística. Isso não substitui o ensaio no Safari/iPhone: fontes do sistema e medidas podem variar. Os PDFs foram gerados pelo motor efetivo do aplicativo e renderizados para inspeção.

## Conteúdo e privacidade

- Sem cotação ou indicador, o campo continua ausente ou identificado; nenhum número de exemplo é introduzido na conta.
- As amostras têm indicação de DEMONSTRAÇÃO / DADOS FICTÍCIOS.
- O resultado financeiro de uma operação aparece somente quando a opção existente de mostrar valores está marcada. O resumo do período mantém o padrão sem resultado em dinheiro.
- A diferença entre variação do preço, retorno sobre capital de referência, resultado em R, data do preço e horário de consulta permanece explícita.
- Cabeçalhos de imagens preservam referências quando fornecidas. Captura recente não significa negócio recente.
- A exportação não solicita nova análise de IA, não publica documentos e não envia mensagens a terceiros.

## Exemplos incluídos

Na pasta amostras-v308: PDFs de análise, carteira e revista; PNGs de panorama, operação, operação com resultado financeiro, período, ranking, giro e jornal. Todos os dados dessas amostras são fictícios. O exemplo de carteira também está no Canva: https://www.canva.com/d/fPV3BCd5rWYaNHL

## Testes reproduzíveis

- node tests/design-v307.cjs
- node tests/terminal-v306.cjs
- node tests/panorama-v306.cjs
- node tests/exports-v308.cjs
- node qa-v308/gerar-pdfs.cjs
- python3 qa-v308/verificar-pdfs.py
- python3 qa-v308/render-imagens.py

Os três primeiros testes verificam regressões da abertura, Terminal e pré-abertura. O teste de exportações exercita seis famílias de renderização, privacidade e instalação dos arquivos. O gerador de PDF usa pdf-lib/fontkit/fontes que já acompanham o aplicativo. A verificação visual usa Python com Pillow/pdfplumber e Poppler. O ZIP original não traz os scripts de build/manutenção referenciados no package.json; não foi alegada execução de npm verify.

## Conferência final após instalar

Abrir pelo ícone instalado, conferir a versão v308 e navegar pelas áreas com dados reais. Gerar um PDF de carteira e uma imagem de operação sem marcar mostrar resultado financeiro; conferir layout, referências e privacidade. Testar baixar/compartilhar no Safari, além das larguras do telefone e do computador.
