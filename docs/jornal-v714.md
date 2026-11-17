# Jornal do Pregão — v714

## Problemas confirmados

- Texto usa cotações coletadas na geração; o PDF antigo juntava depois dados de `RK`, `JR`, `M606` e `JRN.g`, de outros horários.
- A função candles utiliza Ibovespa à vista para WIN e dólar à vista multiplicado por mil para WDO. Esses proxies estavam gerando pivôs e gráficos apresentados como futuros.
- O PDF editorial passava por `rpNovo` e pelo acabamento global de relatórios, desenhando cabeçalhos e rodapés sobrepostos.
- A apresentação tratava a mudança do DI em pontos percentuais como porcentagem e dividia os níveis do WDO por mil.
- A edição noturna mantinha títulos de pré-abertura e fechamento da véspera.
- Os logs da função analise registraram ausência de GEMINI_API_KEY e uso da reserva sem pesquisa. Não foram alterados secrets nem a ordem dos modelos.

## Implementação

- Contrato puro compartilhado entre servidor, tela e PDF, com snapshot por edição, unidades, fonte, contrato, datas de sessão/coleta e limitações explícitas.
- Preparação emite um identificador; todas as partes e a montagem usam esse identificador. A montagem lê exclusivamente partes persistidas pelo servidor, sem aceitar prosa do navegador como edição pública.
- Coleta própria do jornal identifica contratos concretos pela expiração informada no scanner, preserva a data da barra diária separadamente do horário do negócio e rejeita preços incompatíveis com o incremento do contrato. Não muda as fontes das outras abas.
- OHLC incompleto não produz pivô. Proxies à vista não produzem pivôs nem gráficos do futuro. A fonte gratuita não fornece, neste fluxo, série intradiária real do contrato: o PDF suporta séries identificadas, mas não fabrica uma série.
- Dados do BCB e expectativas de mercado entram diretamente no snapshot, com período e fonte. Bases anteriores do Focus só aparecem quando disponíveis.
- Divergências identificáveis de preços/variações e números sem origem nos pedidos sem pesquisa retêm a matéria. Isso é uma verificação determinística parcial, não uma auditoria factual completa.
- Consenso exige valor, fonte e período. Agenda genérica, sem data/fonte, com horário inválido ou vencida sem resultado é omitida.
- FedWatch com faixa-alvo estimada não é exibido. Falta uma fonte completa e validada para habilitá-lo com segurança.
- Novo PDF vetorial com fontes clicáveis, tabelas sem truncamento, cabeçalho/rodapé únicos e separação entre fato recebido, interpretação e cenário.
- Retirado o polling de plantões/cotações a cada 20 segundos no jornal. A exportação não chama IA, mercado ou Supabase.
- Os arquivos compilados e agregados são reproduzidos pelo pipeline existente com `npm run build`; as fontes autoritativas estão em `src/` e `supabase/functions/`.

## Validação

- Build e verificações de bundles/backend concluídos localmente.
- 20 testes específicos de coleta, consistência, geração de PDF e isolamento de snapshots passaram.
- 191 verificações sem navegador passaram na execução ampla disponível.
- A primeira execução completa teve 60 falhas de inicialização do Chromium, todas com bloqueio de socket do ambiente (EPERM); isso não equivale a aprovação de testes de navegação. A suíte completa deve ser conferida no GitHub Actions.
- PDF de amostra explicitamente simulado, renderizado e inspecionado em todas as páginas; testes conferem limites de todos os elementos e links.

## Limites que permanecem

- Uma URL vinculada não comprova por si só a correção semântica de uma afirmação. O sistema não declara qualidade factual 100%.
- A pesquisa por Gemini depende da chave ausente no projeto no momento do diagnóstico. As reservas continuam funcionando com os dados fornecidos, com essa limitação identificada.
- Horário do último negócio, fechamento oficial/ajuste, série intradiária real e FedWatch completo dependem de dados não fornecidos atualmente pelo fluxo. Não são substituídos silenciosamente por aproximações.
- O número de páginas depende do conteúdo; a amostra completa ficou com cinco páginas e não foi alongada artificialmente.
