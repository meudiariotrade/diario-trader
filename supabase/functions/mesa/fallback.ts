/** Uma edição anterior pode ser mostrada, sempre com data e aviso, por até 48 horas. */
export function edicaoSalva(dados: any, agora = Date.now()) {
  const gerado = Date.parse(dados?.gerado || '');
  if (!dados?.capa || !Number.isFinite(gerado) || gerado > agora + 60000 || agora - gerado > 48 * 3600000) return null;
  return { ...dados, cache:true, desatualizado:true, avisoAtualizacao:'A atualização está indisponível. Exibindo a edição salva, de ' + String(dados.dia || '').split('-').reverse().join('/') + '.' };
}
