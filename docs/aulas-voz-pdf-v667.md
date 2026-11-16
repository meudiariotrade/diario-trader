# Aulas: voz editável e PDF do Mentor — v667

Escopo: Estudos > Aulas e serviço de narração das aulas. Avatares, MP4 e diagramas existentes preservados byte a byte; nenhuma migration.

DiarioVoz.normalizarTextoParaVoz usa termos inteiros, maior termo primeiro, correspondência sem diferença de caixa e substituições literais. Padrões incluem todas as siglas solicitadas, MACD e ETF. Dicionário local separado por conta, editável em Aulas, exportável para a ponte. Texto de leitura e diagramas não passam pelo normalizador.

As 18 lições possuem roteiroVoz com abertura e quatro etapas operacionais. O TTS recebe apenas o roteiro normalizado; o manifesto leva ambos os textos para preservar a leitura. A ponte nova aceita os roteiros e dicionario-voz.json local. MP4s existentes precisam ser gerados novamente para mudar áudio.

Gerar Aula do Mentor via PDF usa ntLib/PDF.js já existente, até 25 MB e 40 páginas/85 mil caracteres por geração. Exige texto selecionável; não simula OCR. O texto do intervalo e o tema são enviados ao endpoint aulas/mentor_pdf autenticado. Roteador multi-IA existente, limites de uso existentes, quatro etapas e três questões validadas. Material do PDF tratado como dados. Mapa visual é gerado de tópicos escapados; não se injeta HTML/SVG produzido pela IA. Aula salva na tabela aulas existente com roteiro.mentor e cenas compatíveis com a ponte antiga. A ponte atualizada gera o avatar nas aulas de PDF. RLS e consultas por user_id preservam isolamento; idempotência usa UUID do pedido.

Cancelamento de espera não promete cancelar trabalho já aceito no servidor. Mensagem orienta atualizar a lista antes de nova tentativa. Troca de conta invalida resultados atrasados e limpa o arquivo local selecionado. Sincronização de aulas PDF não remonta mídia em reprodução.

Validação: testes de pronúncia, colisões e caracteres especiais, persistência por conta, texto/diagramas intactos, extração/geração simuladas, isolamento, validação de JSON, autenticação e gravação apenas na conta verificada, integração de navegador, ponte Python. Geração real de PDF e voz no Windows requer sessão do usuário; não foi simulada como resultado de produção.
