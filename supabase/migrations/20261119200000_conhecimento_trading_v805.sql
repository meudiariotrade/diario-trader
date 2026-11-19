-- v805: base vetorial privada; somente trechos curtos, sem PDFs nem imagens.
create extension if not exists vector with schema extensions;
create table if not exists public.conhecimento_trading (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 obra_id uuid not null,
 titulo_obra text not null check (char_length(titulo_obra) between 1 and 200),
 autor text not null default '',
 tipo_fonte text not null check (tipo_fonte in ('Livro_PDF','Video_YouTube','Artigo_Web','Guia_Mercado')),
 categoria text not null check (categoria in ('Analise_Tecnica','Fibonaccing','Price_Action','Fundamentalista','Fatos_Relevantes_Macro','Gestao_Risco')),
 chunk_index integer not null check (chunk_index between 0 and 500),
 conteudo_chunk text not null check (char_length(conteudo_chunk) between 1 and 1400),
 embedding extensions.vector(768) not null,
 modelo_embedding text not null default 'gemini-embedding-001',
 criado_em timestamptz not null default now(),
 unique (owner_id,obra_id,chunk_index)
);
alter table public.conhecimento_trading enable row level security;
revoke all on public.conhecimento_trading from public,anon;
grant select,insert,update,delete on public.conhecimento_trading to authenticated;
create policy "conhecimento_leitura_propria" on public.conhecimento_trading
 for select to authenticated using (owner_id=(select auth.uid()));
create policy "conhecimento_insercao_propria" on public.conhecimento_trading
 for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "conhecimento_atualizacao_propria" on public.conhecimento_trading
 for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "conhecimento_remocao_propria" on public.conhecimento_trading
 for delete to authenticated using (owner_id=(select auth.uid()));
create index if not exists conhecimento_trading_hnsw on public.conhecimento_trading
 using hnsw (embedding extensions.vector_cosine_ops) with (m=8,ef_construction=64);
create index if not exists conhecimento_trading_obras on public.conhecimento_trading(owner_id,obra_id,chunk_index);
create index if not exists conhecimento_trading_categorias on public.conhecimento_trading(owner_id,categoria);
create or replace function public.buscar_conhecimento_trading(
 query_embedding extensions.vector(768), match_count int default 5, filtro_categoria text default null)
returns table (titulo_obra text, autor text, tipo_fonte text, conteudo_chunk text, similarity double precision)
language sql stable security invoker set search_path = ''
as $$
 select k.titulo_obra,k.autor,k.tipo_fonte,k.conteudo_chunk,
        (1-(k.embedding OPERATOR(extensions.<=>) query_embedding))::double precision as similarity
 from public.conhecimento_trading k
 where k.owner_id=(select auth.uid())
 and (filtro_categoria is null or k.categoria=filtro_categoria)
 order by k.embedding OPERATOR(extensions.<=>) query_embedding
 limit least(greatest(coalesce(match_count,5),1),8);
$$;
revoke all on function public.buscar_conhecimento_trading(extensions.vector,int,text) from public,anon;
grant execute on function public.buscar_conhecimento_trading(extensions.vector,int,text) to authenticated;
comment on table public.conhecimento_trading is 'Trechos voluntariamente indexados, privados por auth.uid(); originais PDF/imagens exclusivamente no IndexedDB.';
