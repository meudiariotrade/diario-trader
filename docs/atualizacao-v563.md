# Confiabilidade v563

Base integral: v562, commit b68544f47dee819021ee518ab89878458825eb4e. O Jornal de cinco seções e o desenho atual foram preservados.

As fontes da publicação ficam em `src/`, incluindo núcleo, camadas, estilos, PDFs, HTML, manifest e service worker. `release.config.json` contém a versão única e o mapa dos bundles. O gerador propaga a versão para pacote, cache, HTML, ícones, diagnóstico e aviso de atualização. Os arquivos históricos na raiz permanecem como referência; o build usa exclusivamente esse mapa. Execute `npm run bundle` após editar as fontes. `npm run verify` rejeita bundles que não correspondem às fontes e executa os testes antes da publicação.

O build copia também os recursos em `assets/`, que são solicitados e guardados em cache conforme o uso. Logos e imagens editoriais mantêm os arquivos originais. As funções pesadas de PDF são carregadas na primeira exportação; falhas de carregamento permitem nova tentativa.

O salvamento usa `diario.revision`, com atualização atômica por proprietário e controle otimista. O endpoint anterior continua disponível para aparelhos ainda na v562. Um gatilho incrementa a revisão também nos salvamentos antigos. Rede indisponível, timeout e erros temporários mantêm os dados locais e repetem a sincronização com intervalo crescente. Troca de conta cancela a tentativa anterior.

As 24 funções de produção foram importadas para `supabase/functions/`. O inventário `supabase/deployed-v562.json` registra versões e autenticação do ponto de partida. O `config.toml` mantém a verificação JWT que cada função já usava; as funções que autenticam o usuário no próprio código continuam fazendo isso.

Ordem de implantação: aplicar `supabase/sql/v563-confiabilidade.sql`; verificar RLS e concorrência; publicar `analise` com `validacao.ts`, `notificar` com `entrega.ts` e `mesa` com `fallback.ts`; publicar o frontend após os testes. Nenhum segredo deve entrar no repositório. As outras funções foram versionadas sem alteração de comportamento.

Notificações usam reserva com prazo e identificador por tentativa. A confirmação ocorre após a aceitação pelo provedor. Falhas temporárias entram em nova tentativa, até cinco vezes e por no máximo quinze minutos; cancelamento, mudança de conta e inscrições expiradas são respeitados. O transporte continua tendo garantia de pelo menos uma tentativa, sem promessa de entrega exatamente uma vez em falhas de rede entre envio e confirmação. A tag estável permite ao navegador substituir uma notificação repetida.

A geração automática da carteira processa um ativo por chamada e grava o progresso antes de iniciar, aproveitando o agendamento já existente. A validação usa índice numérico ordenado, preserva sinais e decimais, reconhece períodos de indicadores e não aceita textos anteriores como prova de um número. O selo confere compatibilidade com os dados recebidos; ele não certifica o documento contábil oficial.

Quando a geração do Jornal está indisponível, o servidor pode devolver uma edição salva por até 48 horas, mantendo a data original e um aviso explícito. A função não chama essa edição de nova.
