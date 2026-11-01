/* Apresentação da rotina. Usa os formulários e a persistência do diário existente. */
(() => {
  'use strict';
  const app = () => document.getElementById('app');
  const rulesCount = day => (S.rules || []).reduce((n, rule) => n + !!(day.chk || {})[rule.id], 0);
  const hasText = value => typeof value === 'string' && value.trim().length > 0;
  function routine() {
    const day = S.days[loc().slice(0, 10)] || {};
    const done = rulesCount(day), total = (S.rules || []).length;
    const card = document.createElement('section');
    card.className = 'routine-card';
    card.setAttribute('aria-labelledby', 'routine-title');
    card.innerHTML = `<div class="routine-heading"><div><span class="routine-eyebrow">DIÁRIO · BRASIL</span><h2 id="routine-title">Sua rotina de hoje</h2><p>Prepare o dia. Registre suas decisões. Revise o processo.</p></div></div>
      <div class="routine-steps">
        <button type="button" data-routine="pre"><span class="routine-number">01</span><span><b>Preparar</b><small>${hasText(day.plano) ? 'Plano registrado' : 'Estado, limites e plano do dia'}</small></span><span aria-hidden="true">›</span></button>
        <button type="button" data-routine="dur"><span class="routine-number">02</span><span><b>Registrar</b><small>Trades, emoções e decisões</small></span><span aria-hidden="true">›</span></button>
        <button type="button" data-routine="pos"><span class="routine-number">03</span><span><b>Revisar</b><small>${hasText(day.resumo) ? 'Reflexão registrada' : 'Aprendizados e regras seguidas'}</small></span><span aria-hidden="true">›</span></button>
      </div><div class="routine-footer"><span>Regras seguidas: <b>${done} de ${total}</b></span><button type="button" class="btn s" data-routine="checklist">${total ? 'Revisar checklist' : 'Definir minhas regras'}</button></div>`;
    return card;
  }
  function checklistProgress(root) {
    const inputs = [...root.querySelectorAll('input[data-chk]')];
    if (!inputs.length) return;
    const container = inputs[0].closest('.card');
    if (!container) return;
    container.classList.add('journal-checklist');
    let status = container.querySelector('.checklist-progress');
    if (!status) {
      status = document.createElement('div');
      status.className = 'checklist-progress';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      container.prepend(status);
    }
    const done = inputs.filter(input => input.checked).length;
    status.textContent = `${done} de ${inputs.length} regras seguidas · marque após avaliar suas operações`;
    inputs.forEach(input => input.closest('label')?.classList.toggle('checklist-done', input.checked));
  }
  function enhance() {
    const root = app();
    if (!root) return;
    root.classList.toggle('journal-view', tab === 'dia');
    root.classList.toggle('home-view', tab === 'home');
    if (tab === 'home' && !root.querySelector('.routine-card')) root.prepend(routine());
    root.querySelectorAll('.mc,.cal').forEach(grid => {
      grid.classList.add('month-grid');
      const head = grid.previousElementSibling;
      if (head?.classList.contains('top')) head.classList.add('calendar-heading');
      grid.querySelectorAll('button[data-a="cday"]').forEach(button => {
        const date = button.dataset.id;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return;
        const description = new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {day:'numeric',month:'long',year:'numeric'});
        button.setAttribute('aria-label', `Abrir diário de ${description}`);
        if (date === loc().slice(0,10)) button.setAttribute('aria-current', 'date');
      });
    });
    root.querySelectorAll('button[data-a="cm"],button[data-a="tsm"]').forEach(button => {
      button.setAttribute('aria-label', Number(button.dataset.id) < 0 ? 'Mês anterior' : 'Próximo mês');
    });
    if (tab === 'dia') checklistProgress(root);
    // Nomes explícitos continuam visíveis mesmo quando um tema troca os ícones.
    document.querySelectorAll('button[data-a="deltrade"]').forEach(button => {
      button.textContent = delArm ? 'Confirmar exclusão' : 'Excluir trade';
      button.setAttribute('aria-label', button.textContent);
    });
  }
  const previousRender = render0;
  render0 = function () {
    const result = previousRender.apply(this, arguments);
    enhance();
    return result;
  };
  const previousSheet = showSheet;
  showSheet = function () {
    const result = previousSheet.apply(this, arguments);
    enhance();
    return result;
  };
  document.addEventListener('change', event => {
    if (event.target.matches('input[data-chk]') && app()) checklistProgress(app());
  });
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-routine]');
    if (!action) return;
    const target = action.dataset.routine;
    D = loc().slice(0, 10);
    DV = 'ed';
    if (typeof mdmSet === 'function') mdmSet('br');
    if (target === 'checklist' && !S.rules.length) tab = 'regras';
    else { tab = 'dia'; DFASE = {d: D, f: target === 'checklist' ? 'pos' : target}; }
    render();
    if (target === 'checklist') {
      const first = app()?.querySelector('input[data-chk]');
      first?.closest('.card')?.scrollIntoView({block:'center'});
      first?.focus({preventScroll:true});
    } else window.scrollTo(0,0);
  });
  enhance();
})();
