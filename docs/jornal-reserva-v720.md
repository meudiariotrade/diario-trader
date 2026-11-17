# Reserva textual do Jornal — v720

Gemini continua como principal e sua ordem de modelos não foi alterada. Quando a geração textual com pesquisa falhar (cota, indisponibilidade ou timeout), o Jornal prioriza o Pollinations já integrado ao app como reserva. O teste real do roteador devolveu JSON válido usando gpt-oss-20b.

O orçamento da chamada principal deixa pelo menos 25 segundos para a reserva quando há prazo suficiente. Se o Google recusar a ferramenta de pesquisa e só devolver texto sem pesquisa, isso é detectado e também aciona a reserva. A resposta da reserva é identificada pelo provedor real e não recebe fontes de busca inventadas: usa as notícias, documentos e cotações já coletados, sujeitos à conferência editorial existente.

A alteração é exclusiva das chamadas textuais do protocolo editorial do Jornal. Preferências das outras abas e PDFs/imagens anexados permanecem no fluxo anterior. O roteador compartilhado, incluindo seus modelos primários e cascata global, foi preservado.

Validação: 10 testes de reserva/roteador e 33 testes focados de coleta, qualidade, fontes e montagem aprovados; build/check aprovados. Teste real do provedor e do roteador realizado sem usar dados privados. Publicação completa passa também pelos testes de navegador do GitHub.
