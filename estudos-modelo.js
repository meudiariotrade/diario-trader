/* Regras compartilhadas por Foco, registros e painéis de Estudos. Sem acesso à rede. */
(function (root) {
  'use strict';
  function minutos(value) {
    if (value == null || String(value).trim() === '') return null;
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) && Number.isInteger(number) && number >= 30 && number <= 6000 ? number : null;
  }
  function dataValida(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T12:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function realizada(date, today) { return dataValida(date) && date <= today; }
  function sessoes(log, date, subject) {
    return (log || []).map((entry, index) => ({ entry, index })).filter(({ entry }) =>
      entry && entry.d === date && entry.mat === subject && !entry.reg && Number.isFinite(entry.min) && Number.isInteger(entry.min) && entry.min > 0);
  }
  function meta(value) {
    const number = minutos(value);
    return { min: number ?? 180, definida: number !== null };
  }
  function normalizar(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  root.EstudosModelo = Object.freeze({ minutos, dataValida, realizada, sessoes, meta, normalizar });
})(typeof window === 'undefined' ? globalThis : window);
