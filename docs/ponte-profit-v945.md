# v945 — Recepção e diagnóstico da Ponte Profit

## Escopo
Correção exclusivamente na recepção das cotações Profit do aplicativo, sem alterar os escritores, a ponte local no computador, os trades, o painel institucional do Terminal, o banco ou a identidade visual.

## Diagnóstico no serviço
- A tabela operacional `public.cotacoes` segue recebendo atualizações via escritor externo; portanto o caminho PC → Supabase estava ativo durante a auditoria.
- A tabela `public.operacoes_profit` não continha importações. **Receber cotações não equivale a importar trades**. A importação automática depende de exportação de histórico de ordens (CSV) pelo Profit e processamento pela ponte instalada no Windows.
- O aplicativo usava uma consulta automática de reserva de 15 minutos para preservar egress e nem sempre inicializava a leitura na aba `Cotações ao vivo`.
- Após 30 segundos sem leitura nova o rótulo dizia `Ponte parada`, mesmo quando o produtor continuava enviando ao servidor; era uma afirmação sem verificação.

## Alterações
1. `src/domains/core/02-estado-e-persistencia.js`: abrir a aba `live` tenta uma leitura via `cqPonte()`; essa função já bloqueia consultas automáticas repetidas ao Supabase. Adicionado botão compacto `Atualizar Profit`, atualizando o cache e os dados exibidos. O texto distingue a idade do snapshot de uma falha confirmada da ponte.
2. `profit-cotacoes-v552.js`: a atualização explícita de `Mercado > Cotações` e do botão na aba Live permite um novo GET autenticado se a última consulta ocorreu há 15 segundos ou mais. O ciclo automático continua limitado a 15 minutos; não houve retorno ao polling de segundos do Supabase.
3. `src/index.html`: o script da ponte usa `?v=__APP_VERSION__` para a atualização chegar também a PWAs previamente instalados, em vez de ficar com a versão estática v552.
4. `tests/ponte-profit-v945.test.cjs` valida autenticação por usuário, WINFUT, limitação de leitura e ação manual. CI executa o teste antes de publicar.

## Limitações e próximos passos
- **O código da ponte Windows e o Profit Pro não estão disponíveis no repositório**. Não foi possível iniciar o Profit nem verificar sua janela local, Excel RTD/DDE e arquivo CSV. Não considerar importação de operações corrigida sem entrada real na tabela `operacoes_profit`.
- Em dispositivos sem URL de ponte local segura, `cqPonte()` ainda usa snapshot autenticado do Supabase. Isso **não fornece streaming de mercado em tempo real**, e o app deve apresentar o horário original dos dados, jamais inventar ticks.
- A futura migração de cotações deve levar o escritor a uma API privada autenticada na Cloudflare com anti-replay e envio em lotes. Não transformar cotações individualizadas do usuário em cache público.
- Sem alteração de chaves, RLS, Edge Functions, agenda Cloudflare ou dados privados persistidos.
