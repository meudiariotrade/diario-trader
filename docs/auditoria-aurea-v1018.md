# v1018 — Auditoria de Áurea e Conselho

Base: v1017 publicada. Escopo: oito perspectivas do Conselho, especializações BR/EUA, gráficos, debate, RAG opt-in, simulações e fallback.

## Achados e correções

- Validação de contrato na cadeia de fallback: uma resposta JSON estruturalmente incompleta não deve bloquear os provedores de reserva.
- Renda fixa: entrada monetária brasileira com separadores de milhares, validação de moeda/valor e ressalva de custos sempre visível.
- Roteamento: perguntas didáticas sem ticker seguem Dow; comandos explícitos de commodities e renda fixa preservam as especialidades compatíveis.
- Debate: referências públicas carregadas em paralelo, mantendo limite e sem novas consultas; opção sem lente explícita usa Livermore.

## Matriz automatizada

| Lente | Caso sintético |
|---|---|
| Livermore | VALE3, tendência/pivôs, opções, grade, payoff |
| Graham | ITUB4/JPM/NVDA/MSFT/REIT, FII e valuation |
| Munger | Inversão de tese e premissa vulnerável |
| Markowitz | Carteira, concentração, LCA e Treasury |
| Schwartz | Copom, inflação, commodities e juros |
| Dalio | Dívida pública e geopolítica |
| Helmer | NVDA e 7 Powers |
| Dow | Duration e aprendizado |

Os testes simulam contratos e respostas de provedores, não são pareceres produzidos por modelos externos em tempo real. Mantêm-se as regressões v1004–v1017. Não há pontuação editorial comprovada nem execução de ordens.

## Pendências de validação manual

- Sessão real do usuário: carteira, histórico e consentimento de livros; análise com PDF e anexos gráficos; teste iPhone/desktop.
- Ponte Profit ativa: ofertas atuais, série, origem de strike, reabertura de simulador e ausência de registros automáticos.
- Respostas reais de cada modelo (qualidade semântica, evidências, coerência, limites de dados). Teste autenticado não executado neste ambiente.

Sem logs/analytics do Supabase, alterações de schema, novos serviços pagos ou polling.
