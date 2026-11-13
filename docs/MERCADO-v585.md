# Mercado v585

Correção baseada no CLAUDE.md. A lista de cotações passa a ser montada completa no renderer de origem, antes de entrar na tela. Os decoradores anteriores deixam de criar busca, ordenação, cards duplicados ou colunas sobre essa lista.

- Navegação fixa: Cotações, Notícias, Agenda e Análises. Jornal continua em Notícias.
- Uma cotação por ativo, com fonte/contrato/horário na mesma linha. O destaque independente WIN/WDO e seu cache global foram removidos.
- Registros do Profit com mais de três minutos não são chamados de ao vivo. Fora do horário de negociação, o último registro disponível do contrato vigente ou contínuo pode ser exibido como FECHADO, com seu horário; isso não certifica um ajuste oficial da bolsa.
- Contratos vencidos não substituem o contrato vigente. Valores e variações do registro selecionado permanecem juntos, inclusive quando a variação está ausente.
- Memória da ponte é isolada por usuário; uma resposta da conta anterior não é aplicada após trocar de conta.
- Carregamento e erros por categoria, timeout de 25 segundos e manutenção da consulta anterior quando uma atualização falha. Respostas fora de ordem não alteram a categoria escolhida.
- Referências do panorama entram na categoria correspondente, sem duplicar preços nativos válidos. EWZ/ADRs mantêm sua fonte e lista; curva DI e gráficos/comparações continuam acessíveis no Terminal.
- Busca, foco, seleção, rolagem das categorias e fontes abertas sobrevivem à atualização da lista.
- Superfícies planas, bordas de até 4 px, números tabulares, preços à direita e controles de pelo menos 40–44 px. Análises com controles internos que quebram linha e sem introdução inserida posteriormente.

## Validação

76 testes automatizados aprovados (suíte completa), incluindo regressões de concorrência, fechamento salvo, contrato vigente, isolamento entre contas, busca durante atualização e larguras de 320, 390, 768 e 1440 px. Capturas de Cotações e Análises inspecionadas. Build e recursos conferidos.

Os testes usam fixtures identificadas e rede externa bloqueada. Não substituem uma sessão autenticada no iPhone ou a verificação da disponibilidade das fontes em produção. Nenhuma alteração de banco ou função Supabase foi necessária.
