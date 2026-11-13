# Mercado v586

Segue CLAUDE.md e incorpora a correção de montagem única da v585.

- Cotações, Notícias, Agenda, Análises e Long & Short com navegação fixa.
- Long & Short usa rota mercado:ls, cálculo, gráficos e pares salvos existentes. Formulário primeiro; sugestões e material de apoio recolhíveis.
- Movimentos fortes fica após a lista de Cotações, fora do painel oculto de extras. Mantém notícias, limites e consultas existentes. Falha de consulta ou falta de sessão exibe mensagem e atualização, sem apagar a ferramenta.
- Preços sem duplicação de WIN/WDO; categorias, busca, fontes e Profit preservados conforme documentação da v585.

Validação com testes de navegador e fixtures: navegação e retorno, cálculo de par, validação de ativos iguais, movimentos autenticados, ausência de sessão e layout em 320/390/768/1440 px. Nenhuma alteração em banco ou função Supabase.
