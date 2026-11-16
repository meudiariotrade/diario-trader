# Reprodução contínua das aulas — v666

Causa reproduzida: a sincronização de aulas chama render a cada 30 segundos, substituindo o player da trilha por um novo elemento, sem posição nem estado de reprodução. A proteção de render é exclusiva de mídia ativa na mesma conta e em Estudos > Aulas. Trocar de aba ou de conta encerra a reprodução e desmonta normalmente. Ao fechar o vídeo a lista pode ser montada com os dados atuais.

Ocultar a página também removia o src do MP4. O player nativo agora conserva o arquivo e o tempo; o navegador controla a pausa em segundo plano. Não promete reprodução em segundo plano no iOS. A voz sintetizada mantém a pausa ao ocultar a página. Botão Fechar vídeo encerra o player explicitamente.

Dois testes reproduziram as falhas antes da correção: renderizações em 30, 65 e 121 segundos; ocultar e reabrir a página aos 82 segundos. Verificam identidade do player, tempo e limpeza ao sair. Sem alteração da ponte, dos arquivos de vídeo nem do banco.
