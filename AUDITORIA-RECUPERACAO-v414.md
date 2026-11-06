# V414 — Varredura de acessos e correções de regressão

## Escopo
Base: v413. Nenhum dado financeiro, credencial, banco, serviço ou operação foi alterado.

## Causas identificadas no código
1. Cabeçalho modernizado com `z-index:65`, acima de modais nativos com `z-index:50`: o assistente de início e algumas sobreposições ficavam por baixo do menu.
2. O contêiner `#economista-flutuante` tinha `z-index:39`, inferior ao cabeçalho. Assim, o topo da conversa com o botão de minimizar podia ficar atrás do cabeçalho.
3. O menu novo listava apenas dez áreas principais, enquanto o `render0()` e o menu nativo mantinham várias rotas internas (`conta`, `status`, `import`, `mesa`, `painel` etc.). Algumas telas existiam, mas não tinham acesso destacado ou rota de retorno consistente.

## Mudanças
- Cabeçalho mantido abaixo da faixa móvel de cotações, com fundo opaco; modais nativos acima dele.
- Economista IA acima do cabeçalho quando aberta, com botão de fechar sempre visível e tecla Esc / toque fora. Seu histórico continua intacto.
- Conta, Status, Importação do Profit e Capital/Risco destacados na página de Configurações usando OS PRÓPRIOS BOTÕES EXISTENTES, sem duplicar ações.
- Acesso direto a Conta, Status, Importação, Capital/Risco e Configurações no menu lateral.
- Voltar para Configurações nas rotas internas de administração; título correto no cabeçalho.
- Cache do PWA atualizado para incluir os novos arquivos sem perder nenhum asset existente.
- NENHUMA alteração nos cálculos, Supabase, componentes de mercado e terminal ou gravação dos dados.

## Inventário das rotas existentes
| Categoria | Rotas do aplicativo | Tratamento v414 |
|---|---|---|
| Início e planejamento | home, dia, regras | Preservadas; corrige sobreposição do assistente |
| Operações | trades, swing, opc, fx, ops, opgrade, opfluxo, opcart, swbt, dtrpy | Preservadas |
| Mercado e Terminal | mercado, juros, live, graf, term | Preservadas |
| Registro e desempenho | stats, dash, rev | Preservadas |
| Investimentos | carteiras, analise, imposto | Preservadas e com retorno para Configurações quando abertas por lá |
| Ensino | estudos, livro | Preservadas |
| Capital e risco | painel, mesa, contratos, carreira | Preservadas e com retorno |
| Conta, sistema e dados | mais, conta, status, import, termos | Acesso explicitamente restaurado no menu e Configurações |

## Testes necessários no aparelho
1. Abrir e fechar Economista IA, mudar de aba sem a tela ficar bloqueada, abrir novamente, testar toque fora e Esc no PC.
2. Configurações > Conta; entrar, sair, voltar a Configurações sem alterar seus dados.
3. Configurações > Status do sistema; carregar diagnóstico e voltar.
4. Configurações > Mesa, Painel, Importação, Impostos e Aparência.
5. Início > assistente de boas-vindas, se houver, verificando se o topo e os botões são alcançáveis.
6. Mercado, Terminal, Estudos, Carteira e Diário: conferir navegação sem desaparecimento de função.

## Limites da validação
As rotas foram verificadas no código e os fluxos principais em um teste isolado do navegador. O navegador headless desta sessão bloqueou a navegação para 127.0.0.1, portanto as correções ainda precisam de teste visual no iPhone e PC. Não alegar que testes de ponta a ponta passaram antes de publicar e validar.

## Cache da versão instalada
O pacote incremental contém `sw.js` com cache `diario-v414-recuperacao` e lista explícita dos arquivos novos. Sem a atualização do service worker, o PWA poderia continuar exibindo o `index.html` antigo. Os nomes `terminal-v413.js` e `terminal-v413.css` permanecem intactos.

## Cache da versão instalada
O pacote incremental contém `sw.js` com cache `diario-v414-recuperacao` e lista explícita dos arquivos novos. Sem a atualização do service worker, o PWA poderia continuar exibindo o `index.html` antigo. Os nomes `terminal-v413.js` e `terminal-v413.css` permanecem intactos.


## Verificação funcional adicional (sem servidor hospedado)
Foi possível executar os scripts reais em Chromium via injeção local dos arquivos,
sem rede, para confirmar a navegação **Configurações → Conta → Configurações**,
a abertura e o fechamento da janela IA e o retorno à aba de origem em 390 px e 1440 px.
Sem autenticação nem fontes conectadas, não é teste de integração de conta ou sincronização.
Os atalhos para Importação, Painel, Mesa, Contratos, Carreira e Termos
abrem as **rotas existentes**, sem substituição de formulários.

## Resultado dos testes funcionais isolados
Em ambiente Chromium com os 21 scripts e folhas CSS reais carregados em uma
página de teste (sem acesso às APIs de produção), nos tamanhos **390×844** e
**1440×900** foram verificadas as oito rotas de Configurações — `conta`,
`status`, `import`, `painel`, `mesa`, `contratos`, `carreira` e `termos` —
incluindo o botão de voltar para Configurações em todas elas. Todas as rotas
abriram e voltaram sem erros JavaScript na simulação. Testes de IA: abrir,
fechar no botão, tecla Esc e toque fora. Também passaram nos dois tamanhos.

O menu Configurações apresenta os quatro atalhos mais utilizados e uma seção
expansível **Outras ferramentas de gestão e segurança**, que aponta para
rotas já existentes, sem criá-las novamente. As funções originais de Mercado,
Terminal, Estudos, Carteira e Diário não foram reescritas.

**Limites:** o teste foi local, não uma validação no Safari/iOS nem nas fontes
Supabase autenticadas. Não foi realizado deploy no GitHub ou no aplicativo
instalado. A conta e a sincronização exigem verificação no ambiente hospedado.
