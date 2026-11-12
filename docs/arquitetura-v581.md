# Diário Trader — fontes e responsabilidades da v581

Base preservada: v580, commit `dee95aea976a42d7afa93661bd58b073583c90bc`.

O aplicativo continua sendo consulta, inteligência e diário. A execução de ordens permanece no Profit Pro.

## Onde editar

- `src/analysis/`: comandos, interface de Análises, histórico e estudo.
- `supabase/functions/pesquisa/`: autenticação, etapas recuperáveis, pesquisa, cálculos e atualidade dos documentos.
- `src/navigation/`: destinos, contexto por conta/dispositivo, preparo, diagnóstico e ciclo de vida das telas.
- `src/contracts/`: estados do dia, filas, catálogo de ativos, cobertura fiscal e snapshots de relatórios.
- `src/domains/`: 22 fragmentos que preservam a ordem de execução dos núcleos existentes. Essa primeira extração ainda mantém dependências globais; não é uma reescrita completa por domínio.

`release.config.json` é o registro das fontes. `npm run bundle` concatena os fragmentos em `src/app-core.js` e `src/app-layers.js` e produz os bundles. Não editar o agregado nem o bundle quando houver entrada em `sources` ou `bundles`. `npm run check` rejeita divergência.

`publication.manifest.json` declara entradas e recursos dinâmicos. O build percorre referências reais do JavaScript, HTML, CSS e cache offline. `recursos.json` explica cada recurso publicado. Mensagens que mencionam arquivos antigos não se tornam dependências.

## Donos dos fluxos

| Área | Escrita e responsabilidade |
|---|---|
| Início | Resumo e atalhos para o dono da tarefa |
| Meu dia | Preparo obrigatório, regras pessoais opcionais e revisão |
| Operações | Registros, Histórico, Desempenho e importação Profit |
| Análises | Pesquisa técnica/fundamentalista, comparação, agenda e estudo CNPI |
| Mercado e Terminal | Visões dos mesmos dados, com fonte, símbolo e horário |
| Carteira | Patrimônio, posições e relatórios salvos; não recria importador |
| Estudos | Biblioteca, aulas, prática e retomada das gerações |
| Imposto | Estimativa, notas importadas e cobertura declarada do período |
| Configurações | Conta, preferências, integrações e diagnóstico |

Diário antigo encaminha para Histórico de Operações; Checklist encaminha para o preparo de Meu dia. Os relatórios especializados da Carteira continuam disponíveis e não substituem a nova pesquisa principal.

## Dados e acesso

`data-contracts-v581.json` contém a matriz de fontes, escritores, leitores e preservação. A baseline registra tabelas, índices, funções, políticas, grants, sequências, buckets e jobs sem dados pessoais nem credenciais. Tabelas internas com RLS e sem políticas permanecem inacessíveis aos clientes.

Não mudar a revisão atômica do diário: a v563 foi preservada e seus testes continuam passando. Contexto de navegação e incidentes locais usam chave por proprietário; trocar de conta não herda essas preferências. Respostas assíncronas confirmam o proprietário antes de alterar a interface.

## Pesquisa recuperável

O cliente cria um UUID, o servidor reserva uso uma vez e grava o trabalho privado. Pesquisa, cálculos por ativo e redação são etapas separadas. Uma reserva com prazo e identificador impede execução concorrente e gravação por um trabalhador antigo. Falhas conservam os checkpoints, cancelamento e tentativas limitadas.

A pesquisa usa a chave Gemini existente no servidor. Reserva de modelo mantém a busca habilitada; nunca há fallback de pesquisa para texto sem internet. Sem fontes verificáveis, a etapa falha. Documentos sem origem primária ou atualidade confirmada mantêm a análise parcial. YoY, QoQ, CAGR e indicadores técnicos são calculados; YTD, TTM e trimestre isolado são bases distintas. DCF exige entradas e premissas explícitas. Não se afirma certificação humana.

## Limites que exigem verificação

A migração de todos os timers legados e a eliminação das dependências globais ainda não foram concluídas. O catálogo não substituiu todos os aliases de todos os provedores. A baseline ainda precisa ser reconstruída em um projeto vazio. Comparações contábeis de relatórios reais, Safari/PWA e uso no iPhone não são comprovados pelos testes DOM.
