/** Reserva atômica e confirmação somente após o provedor aceitar o push. */
export async function entregar(db: any, enviar: (s: any,p: any) => Promise<unknown>, row: any, payload: any, chave?: string, reserva?: string): Promise<boolean> {
  let lease = reserva;
  if (chave && !lease) {
    const { data, error } = await db.rpc('push_reservar', { p_chave: chave, p_subscription: row.id, p_payload: payload });
    if (error) throw new Error('Não foi possível reservar a notificação: ' + error.message);
    if (!data?.reservado) return false;
    lease = data.lease;
  }
  let ok = false, erro = '', invalida = false;
  try { await enviar(row.sub,payload); ok = true; }
  catch (e) {
    const status = (e as any)?.statusCode;
    invalida = status === 404 || status === 410;
    erro = String((e as any)?.message || e).slice(0,300);
    if (invalida) await db.from('push_subs').delete().eq('id',row.id);
  }
  if (chave && lease) {
    const { data, error } = await db.rpc('push_concluir', { p_chave: chave,p_lease: lease,p_ok: ok,p_erro: erro || null,p_invalida: invalida });
    if (error || !data) throw new Error('Confirmação de notificação pendente.');
  }
  return ok;
}

export async function retentar(db: any, enviar: (s: any,p: any) => Promise<unknown>) {
  const { data, error } = await db.rpc('push_retentar_lote',{ p_limit: 12 });
  if (error) throw new Error('Não foi possível consultar as notificações pendentes.');
  let enviados = 0;
  for (const item of data || []) {
    // Consulta a inscrição atual: cancelamentos e troca de conta são respeitados.
    const { data: row, error: consulta } = await db.from('push_subs').select('id,sub,user_id').eq('id',item.subscription_id).maybeSingle();
    if (consulta) { await db.rpc('push_concluir',{p_chave:item.chave,p_lease:item.lease_id,p_ok:false,p_erro:'Consulta indisponível',p_invalida:false}); continue; }
    if (!row || row.user_id !== item.subscription_owner) { await db.rpc('push_concluir',{p_chave:item.chave,p_lease:item.lease_id,p_ok:false,p_erro:'Inscrição cancelada ou conta alterada',p_invalida:true}); continue; }
    if (await entregar(db,enviar,row,item.payload,item.chave,item.lease_id)) enviados++;
  }
  return enviados;
}
