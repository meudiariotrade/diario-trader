// Todos os buckets com arquivos privados do usuário. Alterar esta lista, não criar outro limpador.
export const BUCKETS = ['fotos', 'livros', 'aulas-visuais', 'aulas-audio', 'aulas-videos', 'aulas-figuras', 'backups', 'planilhas'];
export const uidOk = (u: unknown): u is string => typeof u === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u);
type StorageClient = { url: string; headers: Record<string, string>; fetch: typeof fetch; deadline: number };
const PAGE = 1000;

/** Lista antes de remover, para que a paginação não pule arquivos após uma exclusão. */
export async function apagaArquivos(bucket: string, uid: string, client: StorageClient): Promise<number> {
  if (!uidOk(uid) || !BUCKETS.includes(bucket)) throw new Error('Destino de exclusão inválido.');
  const root = uid + '/';
  let requests = 0;
  async function request(path: string, method: string, body: unknown): Promise<Response> {
    const remaining = client.deadline - Date.now();
    if (remaining <= 0 || ++requests > 200) throw new Error('Limpeza ainda pendente. Repita a exclusão para continuar.');
    const response = await client.fetch(client.url + '/storage/v1/' + path, {
      method, headers: client.headers, body: JSON.stringify(body),
      signal: AbortSignal.timeout(Math.min(8000, remaining)),
    });
    if (!response.ok) throw new Error(`Falha na limpeza de ${bucket}: ${response.status}. Repita para continuar.`);
    return response;
  }
  async function entries(prefix: string, offset: number): Promise<any[]> {
    const value = await (await request('object/list/' + bucket, 'POST', {
      prefix, limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' },
    })).json();
    if (!Array.isArray(value)) throw new Error('Resposta inválida ao listar arquivos.');
    return value;
  }
  function child(prefix: string, entry: any): string {
    if (!prefix.startsWith(root) || typeof entry?.name !== 'string' || !entry.name ||
        entry.name.includes('/') || entry.name === '.' || entry.name === '..') {
      throw new Error('Caminho inválido na listagem de arquivos.');
    }
    return prefix + entry.name;
  }
  const folders = [{ prefix: root, depth: 0 }];
  let total = 0;
  for (let i = 0; i < folders.length; i++) {
    const { prefix, depth } = folders[i];
    const files: string[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const page = await entries(prefix, offset);
      for (const entry of page) {
        const path = child(prefix, entry);
        if (entry.id) files.push(path);
        else if (entry.id === null && entry.metadata === null) {
          if (depth >= 32) throw new Error('Pastas profundas demais; limpeza não concluída.');
          folders.push({ prefix: path + '/', depth: depth + 1 });
        } else throw new Error('Objeto inválido na listagem de arquivos.');
      }
      if (page.length < PAGE) break;
    }
    for (let offset = 0; offset < files.length; offset += PAGE) {
      const batch = files.slice(offset, offset + PAGE);
      await request('object/' + bucket, 'DELETE', { prefixes: batch });
      total += batch.length;
    }
  }
  // Não remover o login se uma exclusão falhou silenciosamente ou surgiu um novo arquivo.
  if ((await entries(root, 0)).length) throw new Error(`Ainda há arquivos em ${bucket}. Repita a exclusão para continuar.`);
  return total;
}
