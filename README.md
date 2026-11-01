# Diário de Trader — revisão v284

Aplicativo estático publicado no GitHub Pages, com backend no Supabase. As credenciais privadas dos provedores ficam nos Secrets do Supabase.

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
