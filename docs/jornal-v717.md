# Jornal do Pregão v717

Escopo: Jornal (tela, PDF e geração). Ordem dos modelos e das reservas preservada.

- Agenda de IBGE e BLS coletada uma vez no preparo da edição, sem consenso inventado. Horários americanos convertidos pela zona America/New_York; IBGE fica sem hora quando a API não identifica o fuso.
- Recuperação limitada a seis corpos de artigos de domínios permitidos, com timeout, limite de bytes e recusa de redirecionamentos. Falha de fonte deixa a matéria pendente.
- Segunda leitura factual por IA com tempo reservado, conferindo sentido, causa, entidade, período e números. Citação de suporte precisa existir no corpo recuperado. Resultados CVM têm segunda leitura com o documento anexado. Isso reduz erros, sem equivaler a auditoria independente.
- Textos sem evidência ficam retidos, incluindo resumos derivados quando existem divergências.
- Captura manual privada de Profit, com requisição única à ponte local configurada ou à tabela com RLS do usuário. Não escreve no cache público, não altera preços do snapshot editorial e não presume contrato pelo mês. Rejeita WINFUT/WDOFUT sem contrato identificado, horários inválidos e preços fora do tick. FEC não vira ajuste oficial.
- PDF preserva o suplemento privado com referência própria; FedWatch sem probabilidades verificadas oferece consulta à fonte oficial.

## Validação e limites

33 verificações específicas do Jornal aprovadas localmente antes do teste de navegador adicional; build/check aprovados. Consulta real a IBGE/BLS: 13 eventos em 14 dias. Corpo de notícia real: 1.678 caracteres recuperados. Testes de navegador executados pelo fluxo do GitHub porque Chromium local não consegue criar sockets neste ambiente.

Pendências externas verificadas em 17/11/2026: logs registram GEMINI_API_KEY ausente; painel de secrets exige autenticação. Ponte salva WINFUT/WDOFUT, sem máxima e mínima, e só uma barra por raiz no histórico. Não há dados suficientes para validar OHLC completo do contrato vigente ou ajuste oficial. FedWatch oficial por API requer assinatura; nenhuma assinatura foi contratada. Ainda é necessário acompanhar edições reais de pré, intradiário e pós após configurar as fontes. A versão não declara qualidade 10/10 nem precisão financeira garantida.
