# v797 — Reconciliação de preço por ação e fundamentos

Antes de homologar um preço-teto para Top 10, comparar dimensões de **valor de mercado ≈ cotação × ações**, **DY ≈ DPA / cotação**, **P/L ≈ cotação / LPA** e **P/VP ≈ cotação / VPA**. Exigir ao menos duas identidades verificáveis e nenhuma divergência além das tolerâncias documentadas. Comparações não certificam a origem e são inválidas para classes de ação, competências ou data de cotação diferentes, devendo ser tratadas como aviso, não imputação.

A formulação SQL/JS da nota e os 4 pilares não são alterados. A ausência de dados só bloqueia o **selo de Top 10 composto**, não exclui empresas do catálogo nem modifica gráficos ou PDF. Todos os cálculos são locais.

Validação de integração: executar CI no PR direcionado à `main`, preservando todas as versões anteriores da cadeia e os módulos de Checklist/Operações publicados na v789.
