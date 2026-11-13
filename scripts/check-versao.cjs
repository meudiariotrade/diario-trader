// Impede que um pacote antigo (ZIP ou ramo desatualizado) sobrescreva o código publicado.
// Regras: a versão nunca pode diminuir; se arquivos do app forem criados ou alterados, a versão precisa aumentar.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const base = String(process.env.BASE_SHA || '').trim();
if (!base || /^0+$/.test(base)) { console.log('Sem commit de base para comparar; conferência de versão ignorada.'); process.exit(0); }
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
let anterior;
try { anterior = JSON.parse(git('show', base + ':release.config.json')).version; }
catch { console.log('A base não tem release.config.json; conferência de versão ignorada.'); process.exit(0); }
const atual = JSON.parse(fs.readFileSync('release.config.json', 'utf8')).version;
const naoApp = /^(?:docs\/|tests\/|supabase\/|\.github\/|scripts\/|design\/|LEIA-ME[^/]*$|[^/]+\.md$|LICENSE[^/]*$|arquivos-removidos[^/]*$)/;
const alterados = git('diff', '--name-only', '--diff-filter=AM', base, 'HEAD').split('\n').filter(Boolean).filter(f => !naoApp.test(f));
if (atual < anterior) {
  console.error(`Versão ${atual} é menor que a publicada (${anterior}). Este pacote foi montado sobre uma versão antiga: atualize a partir da main antes de publicar.`);
  process.exit(1);
}
if (alterados.length && atual <= anterior) {
  console.error(`Arquivos do app mudaram (${alterados.slice(0, 8).join(', ')}${alterados.length > 8 ? '…' : ''}), mas a versão continua ${atual}. Aumente "version" em release.config.json e gere os bundles.`);
  process.exit(1);
}
console.log(`Versão conferida: ${anterior} → ${atual} (${alterados.length} arquivo(s) do app alterado(s)).`);
