# v668 — Glossário TTS automático (Aulas e Ponte Vídeo)
Escopo restrito a Estudos > Aulas, TTS e a ponte local. Preservados avatar-talking.mp4, avatares PNG, diagramas, conteúdo e outras abas.

## Uso
1. No app, abra Estudos > Aulas > Dicionário de Voz, altere a pronúncia e toque em Salvar dicionário.
2. O navegador mantém uma cópia isolada por conta; ao estar autenticado envia as mudanças à tabela publica.aulas_glossario_tts. Se estiver offline, conserva a pendência e tenta novamente na volta da rede ou quando as Aulas estiverem abertas.
3. A ponte usa a sessão autenticada já salva em config.json para consultar as pronúncias a cada geração (no modo automático, ciclo aproximado de 10 minutos). Não precisa exportar dicionario-voz.json.
4. Instale os scripts atualizados da pasta bridge-video no seu PC uma única vez, mantendo seu config.json e reiniciando RETOMAR PONTE.bat. A sessão existente e suas aulas permanecem.
5. Novos vídeos gerados passam pelo dicionário atual; MP4s já renderizados não mudam de áudio retroativamente. Para a trilha técnica, o hash das pronúncias gera uma nova versão na próxima rodada automática.

## Implementação
O serviço de voz mantém o texto exibido e os diagramas originais. O manifesto exportado conserva o roteiro falado sem expansões prévias, para permitir que o dicionário personalizado seja aplicado pela ponte no momento da narração; isto também evita duplicidade de normalização. O TTS do navegador aplica a mesma normalização ao iniciar a leitura.
GET/UPSERT autenticados com RLS por auth.uid(); a ponte nunca armazena chaves secretas de serviço. Em caso de falha de conexão, a ponte retém apenas o cache da conta atualmente autenticada e tenta consultar novamente. O arquivo manual legado só é lido quando não há conta vinculada ao processo.
O fluxo de build agora gera bundles e manifesto antes dos testes e do deploy em Pages.