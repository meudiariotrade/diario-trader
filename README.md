# Diário de Trader — v311: artes sem subpastas

Correção da mensagem Arte indisponível e da atualização do cache quando a pasta cards-art não foi enviada ao site. Agora as artes estão em cards-assets.js, na pasta principal. Leia LEIA-ME-V311.md.

# Diário de Trader — v310: mais seis temas de cards

Carnaval, Futebol, Páscoa, Festa Junina, Verão e Réveillon, com datas móveis automáticas e seleção manual. Dez estilos no total. Atualização direta; envie também cards-art. Leia LEIA-ME-V310.md.

# Diário de Trader - v309: cards sazonais

Panorama Brasil-EUA e cards personalizados de Mercado, Natal, Halloween e Clássico. Seletor automático/manual e resultado em R removido dos compartilhamentos. Leia LEIA-ME-V309.md antes de instalar e envie também a pasta cards-art.

Pode atualizar diretamente para esta versão. Integrações e cálculos foram preservados. O pacote ainda não foi publicado no GitHub.

Guia dos cards no Canva: https://www.canva.com/d/DJcXJKnH-pf2gRe

## Histórico das revisões anteriores

# Diário de Trader - revisão geral v308

Padrão visual ampliado para áreas internas, PDFs e imagens compartilhadas. Leia LEIA-ME-V308.md para instalação, cobertura, validações e limites. Amostras em amostras-v308 são fictícias e não alimentam os dados do aplicativo.

A revisão foi preparada e testada localmente. Ainda não foi publicada no GitHub; o ensaio completo com sessão real no iPhone está pendente.

Modelo do relatório no Canva: https://www.canva.com/d/fPV3BCd5rWYaNHL

## Histórico das revisões anteriores

# Diário de Trader — design v307

Atualização visual sobre a v306: abertura com a marca original, início com hierarquia mais clara, atalhos para funções existentes e abas consistentes. Temas claro/escuro, avisos de risco, personalização do início, dados e integrações permanecem disponíveis.

Guia visual editável no Canva: https://www.canva.com/d/L7lr6M1u5mtSGWZ

## Como instalar

Extraia o ZIP e envie o conteúdo da pasta diario-trader-main à raiz do repositório, preservando as demais pastas existentes. Os arquivos alterados desta revisão são index.html, app.js, sw.js, manifest.webmanifest, package.json e release.config.json. Acrescente design-profissional.js e design-profissional.css. A publicação precisa levar o conjunto completo para o cache v307; evite enviar apenas o CSS.

O arquivo design-guia.html é uma referência visual e não faz parte da navegação do aplicativo. O mockup gerado na conversa é ilustrativo: os botões de cadastro mostrados na proposta não foram introduzidos na abertura real. A abertura conserva o encerramento automático já existente, sem aguardar interação ou acrescentar atraso.

## Melhorias

- Marca original na abertura, mensagem breve e apresentação alinhada ao novo tema.
- Início com saudação por horário de Brasília e data, título claro e acessos para Terminal, Carteiras e Estudos.
- Cartão existente da rotina reorganizado com acesso Abrir meu dia. Registros, regras e avisos de risco permanecem acessíveis.
- Abas principais e secundárias com hierarquia visual, indicação de seleção e rolagem horizontal quando necessário, sem criar novos níveis de navegação.
- Cartões, campos, menus, navegação inferior e botão de registro com dimensões e acabamentos consistentes.
- Terminal com cabeçalho e abas na paleta do aplicativo, preservando o significado das cores de alta e baixa nas cotações.
- Tema claro mantido e respeito à preferência de movimento reduzido.

## Validação

Verificação de sintaxe dos JavaScripts alterados; testes diretos com Node para montagem sem duplicação, atalhos, preservação de dados e avisos, navegação acessível e inclusão dos arquivos no cache. Os testes da v306 de Terminal e pré-abertura também foram executados novamente.

Comandos: node tests/design-v307.cjs; node tests/terminal-v306.cjs; node tests/panorama-v306.cjs.

A revisão visual em navegador real/iPhone e o ensaio com sessão autenticada continuam pendentes. O navegador de teste não está disponível neste ambiente. Esta revisão não altera Supabase nem publica no GitHub. O ZIP original não contém os scripts de build/manutenção referenciados no package.json; execute os testes novos diretamente com Node.

## Histórico

# Diário de Trader — revisão v306

Pré-abertura integrada após as ADRs, exportação com rodapé escuro e Terminal com Radar Global, curva DI e notícias Brasil/EUA em abas internas.

**Instalação:** extraia este ZIP e envie os arquivos de `diario-trader-main/` à raiz do repositório do aplicativo, preservando os demais arquivos. Inclua `terminal-radar.js`, `adr-abertura.js`, `mercado-monitor.js`, `app.js`, `index.html` e `sw.js`. O cache v306 instala o conjunto completo.

Não exige alteração no banco ou publicação de Edge Functions. Esta entrega é um pacote atualizado; não foi publicada no GitHub.

Testes desta revisão: `node tests/terminal-v306.cjs` e `node tests/panorama-v306.cjs`. A validação visual no iPhone e o ensaio do frontend com uma sessão autenticada continuam pendentes. O ZIP recebido não inclui os scripts de build/manutenção referenciados no package.json; os testes novos podem ser executados diretamente com Node.

## Alterações

- Abertura teórica no mesmo fluxo do panorama, logo após as ADRs, com colunas de ativo, fechamento, variação estimada e preço teórico; permanece identificada como estimativa.
- Referências de consulta preservadas em fundo escuro, sem faixa branca.
- Exportação aguarda o cálculo da pré-abertura; pedidos concorrentes compartilham o trabalho e séries de ações são consultadas em lotes de três.
- Seletor sólido, compacto, com pesquisa e rolagem: Radar Global, Fluxo, Juros, Central de Inteligência e todos os demais espaços.
- Último espaço e aba restaurados, com preferências locais separadas por usuário.
- Radar Global reúne Nasdaq futuro, S&P futuro, WIN, WDO, dólar/real, DXY, VIX e Treasury de dez anos. O futuro Nasdaq permanece identificado separadamente do CFD USTEC da corretora.
- Abas internas para índices, moedas, commodities, ADRs, DI, Copom/Fed, agenda e notícias Brasil/EUA. Espaços personalizados existentes são preservados.
- Atualizações usam o ciclo do Terminal: cotações com cache de 30 segundos, DI de 60 segundos e notícias de 3 minutos. São intervalos de consulta, não garantia de tempo real. Consultas novas pausam com a página oculta.
- WIN/WDO reutilizam a ponte do Profit quando disponível. O Radar distingue data/hora do negócio e horário de recebimento. Preços ausentes ficam sem valor; nenhum dado é simulado na tela.

## Conferência do Supabase — 02/11/2026

Projeto Diário de trader ativo; funções terminal, candles, macro, adrs e juros ativas. Cache quotes/DI disponível e rotina mercado-cache-minuto com últimas execuções concluídas. As tabelas públicas listadas têm RLS habilitada.

A ponte enviava WINFUT, WDOFUT, DI1F29 e DI1F33 com data de negócio de 30/10, embora o recebimento fosse de 02/11. O Radar mostra essas referências separadamente.

O auditor também apontou avisos preexistentes sobre as funções SECURITY DEFINER erros_app_limpa e parceiro_ver, além de proteção contra senhas vazadas desativada. Não foram alterados privilégios nem configurações de autenticação nesta revisão. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Histórico recebido no ZIP original

# Diário de Trader — revisão v290

Aplicativo estático publicado no GitHub Pages, com backend no Supabase. As credenciais privadas dos provedores ficam nos Secrets do Supabase.


## Revisão v290 — estrutura e confiabilidade da manutenção

- Fontes do legado organizadas em 26 arquivos legíveis, com ordem de montagem explícita; app.js e sw.js gerados e verificados.
- Mapa de depuração com referência às fontes; dependências de desenvolvimento fixadas; workflow de testes sem acesso de escrita ou credenciais de produção.
- Imagens editoriais extraídas sem recompressão; aplicativo principal reduzido em aproximadamente 190 KB em relação à v289.
- Limites automáticos para impedir novos aumentos de substituições de funções e estilos históricos. O legado global ainda precisa de migração gradual.
- Versões e hashes coerentes; fontes PDF e imagens essenciais passam a integrar a instalação atômica. Publicação com recurso essencial ausente não é ativada.
- Avaliação de regras permanece no Depois, com instruções coerentes; botão do aviso de stop com cores explícitas e legíveis.
- Um único editor visível para organizar o início, com preservação das preferências antigas. Patrimônio, metas e estudos recolhidos por padrão quando não existe organização personalizada.

Instalação recomendada: extrair o ZIP principal `v290-github.zip` e enviar seu conteúdo à raiz, preservando as subpastas. Os dois ZIPs separados são alternativas para atualização e manutenção. Para manter fontes, ferramentas e testes no GitHub, enviar também o ZIP complementar de manutenção. Nenhum deles altera o Supabase automaticamente. O complemento contém referências locais do backend para os testes.

Veja [manutenção](docs/MANUTENCAO.md) e [índice das fontes](docs/FONTES.md). A v290 está validada localmente; publicação direta bloqueada pela permissão da integração GitHub (403). Não considerar esta revisão instalada até enviar os arquivos e conferir o site.

Os registros abaixo são históricos e descrevem o estado de cada entrega à época. A orientação fundamentalista da função analise v288 foi posteriormente publicada com autorização do usuário; não é uma pendência de implantação da v290.

## Revisão v289 — revista técnica de fim de semana

O fluxo principal do Jornal e seu botão PDF agora abrem a revista técnica no fim de semana. IBOV, dólar à vista e ações têm estudos diários/semanais, níveis e cenários calculados. WIN e WDO usam seção própria com snapshot real do contrato, sem rotular dados à vista como futuro. Notícias não são geradas nessa edição. Não exige nova Edge Function e não consome cota de IA no novo carregamento. Ver docs/REVISAO-v289.md para cobertura, limites e verificações.

Atualização mínima comparada com o GitHub, incluindo só arquivos de execução necessários. Testes visuais no iPhone e ensaio das fontes com sessão real ainda devem ser conferidos após instalar.

## Histórico — Revisão v288 — posição, proventos e pesquisa patrimonial

A IA tratada nesta revisão é a de Carteiras, com análise consolidada e por ativo. A Economista flutuante continua separada. A ficha de posição recebe os dados gerenciais da referência enviada pelo usuário; a análise abre com gráficos de evolução/renda e exporta PDF próprio, sem candles. Receita e lucro anuais aparecem quando disponíveis no relatório individual. Não presume proventos nem histórico onde faltam dados.

A atualização do prompt da Edge Function está preparada, mas foi bloqueada pela revisão automática e ainda não foi publicada. O pacote GitHub não inclui código do backend. A interface utiliza os relatórios existentes; a nova orientação fundamentalista depende da autorização específica para publicar a função analise em produção. Veja docs/REVISAO-v288.md.

Testes: 13 suítes e ensaio DOM; PDF demonstrativo de cinco páginas renderizado e revisado. Testes visuais em iPhone e sincronização real continuam pendentes. Dados reais não foram usados no PDF de demonstração.

## Histórico — Revisão v287 — Monitor, EWZ/ADRs e navegação

- Monitor usa a tela atual de cotações (`cq`), sem o redirecionamento legado para Juros. O endereço antigo `cot` funciona como alias.
- Quatro áreas: Panorama; Informação (jornal, notícias, agenda); Estudos; Monitor. A barra amarela paralela é removida dessas telas; o terminal permanece acessível no cabeçalho.
- EWZ e ADRs ficam dentro do Monitor, com a mesma lista personalizada e o mesmo cache usados pela imagem do panorama. Um atalho permanente aparece no início e no panorama.
- Atualização autenticada, pedidos simultâneos compartilhados e recarga com a lista aberta. Falhas preservam a data da consulta anterior. Consulta recente não é apresentada como prova de cotação em tempo real.
- Captura força consulta do panorama e ADRs, mantém as cargas auxiliares de agenda/balanços, mostra as referências e exige confirmação para usar dados antigos ou parciais em caso de falha.
- A implementação não altera Edge Functions, RLS ou dados da conta. Há teste DOM offline do clique Monitor, alias legado, atalho, lista compartilhada, erro de consulta sem adulterar data e cancelamento da captura. Ensaio visual em iPhone/navegador real permanece pendente.

**Pacote mínimo:** comparar hashes com o GitHub atual e enviar somente arquivos de execução novos/alterados. O repositório foi conferido já na v286; faltava a pasta fonts. O ZIP v287 não inclui testes, documentação, código do backend nem arquivos idênticos aos publicados. Preservar a estrutura fonts/ ao enviar. Não apagar os demais arquivos do repositório.

## Histórico — Revisão v286 — diário, conversa e pesquisa

- Economista IA em conversa flutuante entre telas. Contexto opcional inclui somente tela, data e ativo; saldos e textos do diário não são anexados. Usa a análise autenticada e a cota existentes.
- Busca global de operações, notas, diário Brasil/EUA, regras e livros. Modelos editáveis de day trade, swing e mercado americano preenchem apenas campos vazios.
- Operações ligadas ao diário da data, prints e avaliação declarada do processo. Regras capturadas no registro; até 50 versões anteriores e 100 eventos por registro, com restauração como nova edição.
- Revisão semanal com uma ação para o plano da segunda seguinte. Comparação entre seguir o plano, quebrar regras e ausência de avaliação, com moedas separadas e tamanho da amostra.
- Importação CSV com resumo da prévia e até 30 lotes recentes; desfazer preserva operações alteradas posteriormente. A captura de lotes não abrange importação automática do Profit.
- Organização dos módulos opcionais do início; avisos essenciais continuam visíveis. Central de dados, fontes e datas disponíveis.
- Demonstração em `?demo=1`: IndexedDB separado, preferências prefixadas, rede externa e conta real desativadas, dados fictícios identificados.
- Botão **Relatórios**: pesquisa da carteira com fichas por ativo, fundamentos por classe, técnica, fontes, datas e lacunas. O botão de PDF da análise da carteira também abre o novo documento vetorial.
- Revista do Pregão com estudos diários e semanais dos ativos selecionados e cenários condicionais mecânicos. Carregue os históricos antes de exportar. Não cria preços nem probabilidades; agenda depende da edição carregada.
- Preferências do jornal diário: editorias, ativos e texto integral ou resumido. Fontes e paginação locais mantidas.

**Entrega atual:** pacote v286 preparado e validado localmente; publicação no GitHub bloqueada pela revisão automática por limite de uso da integração. Nenhuma alteração adicional no Supabase é necessária para esta versão. O frontend v285 publicado pelo usuário foi usado como base, sem divergências nos arquivos sobrepostos na consulta inicial.

**Testes:** `node scripts/testar.cjs` executa 12 suítes sem instalar dependências. Para ensaio DOM offline do aplicativo completo, `npm ci` e `npm test` (Node 24); são dependências somente de desenvolvimento. A checagem DOM não substitui testes visuais em iPhone/Safari e Chrome. Os PDFs demonstrativos foram gerados pelo mesmo código do app, renderizados e revisados.

**Limites:** não inclui uma auditoria fiscal/contábil integral nem certificação de segurança. A análise fundamentalista depende dos indicadores e relatórios existentes; valuation completo exige demonstrações e premissas suficientes. Históricos começam após a instalação e não substituem backup. IA e carregamentos de mercado só ocorrem por ação do usuário nas ferramentas novas; os módulos legados mantêm seus carregamentos anteriores.

## Histórico — revisão v285

- Diário com relógios por campo: preserva edições independentes em aparelhos diferentes, incluindo checklist e contexto EUA. Conflitos do mesmo campo guardam as versões e aparecem para conferência e recuperação.
- Gravação na nuvem com comparação atômica (CAS). Se a cópia mudou desde a leitura, o app recebe a versão atual, mescla e tenta novamente até três vezes; não usa sobrescrita sem comparação como fallback.
- Modo foco no diário e abas internas alinhadas aos grupos do menu.
- Histórico americano ampliado: busca desde dezembro de 1949; estudos a partir de 1950. Midterms, presidenciais e conjunto de eleições gerais regulares. D-1, D0 e D+1 com datas, fechamentos e variações, além de janelas maiores.
- S&P: 19 midterms e 19 presidenciais no retorno do pregão seguinte até 2024. Nasdaq 100: 10/10; Dow: 8/9; Russell 2000: 9/10, conforme histórico efetivamente retornado em 01/11/2026. D0 pode não existir; nesse caso não se fabrica cotação e a janela posterior parte da última sessão anterior.
- Jornal do Pregão: título editorial, margens e rodapés revistos, fontes locais incorporadas e remoção de gráficos decorativos sem dados. Mantém as seções do gerador anterior; evita página só de encerramento.
- Recursos de apoio do repositório incluídos e referências de ícones corrigidas. Verificação automática de recursos, versões e hashes.

### Instalação

Envie os arquivos desta pasta para a raiz do mesmo repositório do aplicativo, preservando `fonts/`, `scripts/`, `tests/`, `docs/` e os módulos novos. Não envie a pasta como um diretório extra e não apague os dados do navegador. Não basta substituir apenas app.js: todos os scripts e os arquivos do PDF precisam acompanhar index.html e sw.js.

O backend já foi atualizado: macro v285 (versão nativa 39) e RPC `diario_salvar_cas`. Não é necessário reaplicar SQL no projeto atual. Para outro projeto, a definição da RPC está em `supabase/schema/diario_cas.sql`; publicar macro exige também `sazonal-us.ts`.

Atualize todos os aparelhos para a mesma publicação antes de avaliar sincronização concorrente. Clientes antigos continuam usando seu mecanismo anterior.

### Validação

Execute `node scripts/testar.cjs` com Node 24. O teste do jornal usa uma edição demonstrativa e as fontes locais. Não usa notícias, posições ou dados pessoais reais.

Direção visual editável no Canva: https://canva.link/ylccuu1etm1vfx6

**Estado:** backend publicado; interface e PDF prontos neste pacote, sem publicação no GitHub por erro 403 da integração. Validação visual de PDF demonstrativo realizada. A validação completa dos fluxos em iPhone/navegador real, restauração completa entre aparelhos, auditoria fiscal e revisão integral de segurança continuam pendentes. A organização por módulos começou pelas partes alteradas; o legado ainda não foi totalmente reestruturado.

## Interface e mercado americano v284

- Menu com oito grupos e busca sem acentos: Início, Diário, Operações, Mercado, Patrimônio, Gestão, Estudos e Configurações. As modalidades ficam dentro de Operações. Preferências não repete a lista de ferramentas.
- Mercado usa abas Panorama, Agenda, Notícias, Análise e Monitor. Sazonalidade e sentimento ficam dentro de Análise, com Brasil e EUA no mesmo lugar.
- Menos gradientes no resumo, hierarquia de texto, números alinhados e tabelas com rolagem própria.
- Densidade confortável ou compacta em Preferências. A opção compacta só altera espaçamento em telas de computador; preserva campos e alvos de toque do celular.
- EUA: S&P 500, Nasdaq 100, Dow Jones e Russell 2000. Estudos mensais, ciclo presidencial por ano civil e janelas de midterms desde 2000.
- Média, mediana, proporção de janelas positivas, dispersão, extremos, tamanho da amostra e tabela de cada observação. Períodos atuais ou futuros incompletos ficam fora.
- Midterms usam fechamento do dia da eleição como base. A janela de 1 pregão termina no próximo pregão; não é uma medida de causalidade nem separa partidos vencedores.
- Dados em USD de índices de preço, sem dividendos reinvestidos, taxas ou câmbio. Fonte e metodologia visíveis.

**Publicação:** a função macro v284 já está ativa no Supabase (versão nativa 38), com autenticação e limites anteriores preservados. A interface está preparada no pacote; não foi publicada no GitHub por falta de permissão da integração. A inspeção visual em navegador real continua pendente.

**Atualização do frontend:** substituir `app.js`, `style.css`, `index.html`, `sw.js`, `diario-profissional.js` e acrescentar `mercado-profissional.js` na raiz. Manter `terminal-praticidade.js` instalado. Não é preciso reaplicar SQL nem republicar funções para instalar esta interface.

Veja `docs/DESIGN-E-SAZONALIDADE-v284.md` para decisões de design e método.

## Interface v283

- Corrige a regra da faixa de 14 dias que atingia o calendário mensal. O mês volta a ter sete colunas, incluindo as lacunas antes do primeiro dia.
- Calendários usam colunas de largura mínima zero e controles com nomes acessíveis.
- Excluir trade e Confirmar exclusão têm texto explícito, fundo vermelho e texto branco, preservando confirmação e Desfazer existentes.
- A tela inicial prioriza Preparar, Registrar e Revisar. Os atalhos abrem o diário de hoje no contexto Brasil e na etapa correspondente.
- O checklist informa quantas regras foram seguidas e ignora regras removidas no resumo inicial. Continua sendo uma avaliação do processo; não bloqueia nem autoriza operações.
- Campos do diário, formulários, cabeçalhos e botões recebem ajustes de largura, toque e quebra de texto.
- O novo `diario-profissional.js` usa os dados e a gravação existentes, sem criar outro armazenamento.

Para atualizar somente o aplicativo, substitua na raiz **app.js, style.css, index.html e sw.js**, e acrescente **diario-profissional.js**. Mantenha terminal-praticidade.js já instalado. A atualização v283 do cache leva o novo módulo junto.

**Estado da entrega:** alterações locais preparadas; gravação no GitHub recusada pela integração (403). A publicação não foi efetuada. O navegador de revisão não respondeu nesta sessão, portanto a verificação visual em iPhone e desktop permanece pendente. Os testes automatizados abaixo verificam comportamento e regressões, não aparência final.

## Alterações anteriores (v282)

- O contador de IA passa a reservar uso de forma atômica no Postgres. Falhas do controle de uso não liberam análises sem limite.
- As ações de testar, cancelar e atualizar notificações verificam o usuário e a propriedade da inscrição.
- A exclusão de conta passa a usar a chamada autenticada do próprio app.
- A sincronização preserva a maior data de exclusão e a versão mais recente das regras.
- O aviso de salvamento local depende da conclusão da transação IndexedDB. O plano do dia salva durante a digitação.
- O service worker instala os arquivos essenciais juntos e não atualiza o JavaScript isoladamente dentro de uma publicação.
- O terminal compartilha consultas idênticas simultâneas na mesma instância, mantendo os dados, TTL e fallback anteriores.
- A função de candles tenta a segunda origem do Yahoo quando a primeira falha.
- O resumo recebe ajustes de contraste e leitura, com espaçamento e campos adaptados a telas menores.

## Navegação rápida no terminal

Abra o terminal e clique em **Comandos**, ou pressione **Ctrl + Espaço** no computador.

- Pesquise pelo código ou assunto: “juros”, “agenda”, “gráfico”, “notícias”. A busca ignora acentos.
- Use as setas e Enter, ou clique no comando desejado.
- Marque a estrela para guardar favoritos. Os primeiros favoritos aparecem na barra do terminal.
- Os filtros **Favoritos** e **Recentes** ajudam a voltar aos comandos usados.
- O ativo do painel selecionado ganha atalhos para gráfico, fundamentos e notícias.
- **Qualidade dos dados** abre o painel DQ já existente no aplicativo.
- Escape fecha a busca. A tecla Tab permite navegar pelos botões e estrelas.

As melhorias usam os comandos e espaços de trabalho já existentes. As referências de usabilidade públicas da Bloomberg estão em `docs/REFERENCIAS-TERMINAL.md`.

## Fontes do backend

As 15 funções estão em `supabase/functions/<nome>/index.ts`. As funções anteriores continuam completas; a função `macro` agora inclui o módulo relativo `sazonal-us.ts`, que deve acompanhar `index.ts` em qualquer republicação. O `supabase/config.toml` preserva a configuração de verificação de JWT das funções publicadas, que validam autenticação no próprio código.

O antigo `index.ts` da raiz e `backend-analise-gemini.md` são referências históricas; os arquivos de `supabase/functions` representam o backend desta revisão. Não publique a referência antiga por cima dessas versões.

A estrutura de cache e uso de IA está em `supabase/schema/ai_quota_and_cache.sql`. Ela já foi aplicada no projeto durante esta revisão; não é necessário reaplicá-la para atualizar o frontend.

Nunca versione `service_role`, chaves secretas, arquivos `.env` nem tokens de sessão. `config.js` contém apenas a URL e a chave pública do projeto.

## Verificação local

Com Node.js 24 ou mais recente:

```sh
node tests/navegacao.cjs
node --disable-warning=ExperimentalWarning tests/sazonal-us.cjs
node tests/layout-diario.cjs
node tests/salvamento.cjs
node tests/terminal-tools.cjs
node tests/service-worker.cjs
node --disable-warning=ExperimentalWarning tests/backend.cjs
```

Os testes de backend simulam os provedores e as inscrições, sem enviar notificações reais ou apagar contas. Veja `docs/VALIDACAO.md` para verificações feitas no projeto e limitações.
