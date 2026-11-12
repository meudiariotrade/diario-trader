# Validação v581 — estado verificável

## Confirmado

- 54 testes sem navegador passaram na rodada registrada: comandos, dados financeiros, ausência de fontes, autenticação simulada, DOM de navegação, sincronização, relatórios, Terminal e segurança de backup/exclusão.
- Build, referências, fontes geradas e sintaxe de 25 funções / 35 arquivos TypeScript conferidos.
- Função `pesquisa` v2 ativa no Supabase. A chamada real sem login recebeu HTTP 401.
- Migração aditiva de trabalhos aplicada. RPCs de criação, reserva e resposta inacessíveis a `anon` e `authenticated`; execução exclusiva do servidor.
- `supabase/tests/v581-analises-isolamento.sql` executado com sucesso: retry sem duplicar uso; outra conta sem acesso; reserva concorrente bloqueada; reserva expirada substituída; resposta do quiz idempotente; cliente sem escrita ou RPC privilegiada. Todas as fixtures foram revertidas.
- A primeira prova real de busca recebeu HTTP 429 do provedor. A reserva de modelo também recebeu cota esgotada (HTTP 429 do provedor, resposta 503 do endpoint). Não foi comprovada geração real; é necessário o provedor voltar a aceitar chamadas.

## Pendências de publicação e operação

- GitHub: o primeiro push foi recusado pela revisão automática por considerar o repositório e o payload não verificados. O conector confirmou depois `meudiariotrade/diario-trader`, ID 1409769467, `main` na base esperada e permissão de push. O segundo push também foi recusado pela revisão automática, que exige autorização explícita para enviar este payload ao destino. Nenhum arquivo desta v581 foi publicado no GitHub.
- O Chromium local falhou com `socket() failed: Operation not permitted`. Os testes de navegador e capturas 320/390/1440 foram incluídos em CI, mas não estão aprovados até uma execução passar.
- A migração `consolidar_rotinas_v581` não foi aplicada: a confirmação do serviço expirou. Não declarar redução de chamadas nem consolidação de políticas em produção.
- A função antiga `analise` recebeu no código limitação de concorrência do Jornal, correlação de requisições e validação de fatos dentro de arrays. Não declarar essas alterações implantadas sem confirmar deploy.
- A proteção de senhas vazadas depende de plano Pro; o projeto está no plano gratuito. Nenhuma mudança de plano foi feita.
- Não foram enviados alertas, executadas ordens, alteradas posições reais, removidas mídias ou compartilhados relatórios financeiros do usuário.

## Relação com os 24 itens da revisão

| Itens | Entrega ou limite |
|---|---|
| O01 | Consulta livre e preparo na tentativa de registro; testes DOM e teste de navegador preparado fora de demo |
| O02 | Contrato e indicadores separados para preparo, regras opcionais e revisão; disciplina legada preservada |
| O03 | Registro de destinos e aliases; Histórico mantém Operações como dono |
| O04 | Contexto por conta/dispositivo, filtros, fase, detalhes e rolagem; reabertura coberta pelo contrato |
| O05 | Mapa de responsabilidades e fontes documentado |
| T01 | Extração inicial em 22 fragmentos; dependências globais ainda exigem etapas posteriores |
| T02 | Coordenador de ciclo de vida, observadores de organização reduzidos e timer da fonte do Terminal vinculado à tela; timers legados restantes pendentes |
| T03 | Manifesto de publicação e rastreamento de dependências; cópias antigas sem referência excluídas do pacote |
| T04 | Fonte oficial e geração verificadas nos módulos alterados; consolidação dos demais legados continua gradual |
| D01 | Baseline e migrações versionadas; reconstrução integral de ambiente vazio pendente |
| D02 | Matriz de fontes/escritores/leitores e preservação da revisão atômica |
| D03 | SQL de disparos condicionais preparado; confirmação de implantação pendente |
| D04 | Nova pesquisa com UUID, lease, limite idempotente, checkpoints e retomada; migração dos demais modos antigos pendente |
| D05 | Falhas de rede registradas, redigidas e deduplicadas; recuperação no mesmo incidente e separação por conta |
| D06 | Preservação e procedimento de restauração documentados; restauração integral de mídia real em ambiente isolado pendente |
| I01 | Catálogo compartilhado e símbolo de provedor no Terminal; consolidação dos aliases antigos ainda parcial |
| I02 | Vocabulário compartilhado e histórico da nova pesquisa; adaptação das demais filas ainda parcial |
| I03 | Snapshots de edição e conteúdo para saídas existentes; comparação integral da apresentação Mesa com os demais formatos pendente |
| R01 | Snapshots e verificações numéricas preservados; geração autenticada com o último ITR oficial e comparação visual pendente |
| R02 | Estimativa não excluída por nota parcial, conferência explícita de cobertura e invalidação após edição; auditoria fiscal e todos os exportadores antigos pendentes |
| S01 | Matriz e teste de isolamento da nova tabela; consolidação das quatro políticas equivalentes aguarda confirmação |
| S02 | Limitação de plano verificada; proteção de senhas vazadas não habilitada |
| Q01 | Testes fora de demo e capturas adicionados; CI e iPhone/Safari pendentes |
| Q02 | Fontes e referências catalogadas; novos controles nomeados, tablists e teclado; arquivo Figma atual não fornecido |

Este arquivo não representa conclusão de 100% dos 24 itens.
