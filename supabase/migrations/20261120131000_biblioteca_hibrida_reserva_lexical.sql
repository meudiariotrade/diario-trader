alter table public.conhecimento_trading alter column embedding drop not null;
alter table public.conhecimento_trading add column if not exists termos_busca text not null default '';

create or replace function public.buscar_biblioteca_hibrida(consulta text, query_embedding extensions.vector default null, match_count integer default 5, filtro_categoria text default null)
returns table(titulo_obra text, autor text, tipo_fonte text, conteudo_chunk text, similarity double precision)
language sql stable security invoker set search_path = '' as $$
 with termos as (
  select string_agg(quote_literal(term),' | ')::tsquery as q
  from unnest(tsvector_to_array(to_tsvector('pg_catalog.portuguese',left(consulta,480)))) term
 ), candidatos as (
  select k.id,k.titulo_obra,k.autor,k.tipo_fonte,k.conteudo_chunk,
   ts_rank_cd(to_tsvector('pg_catalog.portuguese',k.conteudo_chunk||' '||k.termos_busca),termos.q,32) as lexical,
   case when query_embedding is not null and k.embedding is not null then
    1-(k.embedding operator(extensions.<=>) query_embedding) end as semantica
  from public.conhecimento_trading k cross join termos
  where k.owner_id=(select auth.uid()) and (filtro_categoria is null or k.categoria=filtro_categoria)
 ), ranks as (
  select *,row_number() over(order by lexical desc nulls last,id) as pos_texto,
   row_number() over(order by semantica desc nulls last,id) as pos_vetor from candidatos
 )
 select r.titulo_obra,r.autor,r.tipo_fonte,r.conteudo_chunk,coalesce(r.semantica,r.lexical::double precision)
 from ranks r where r.lexical>0 or r.semantica is not null
 order by (case when r.lexical>0 then 1.0/(60+r.pos_texto) else 0 end +
           case when r.semantica is not null then 1.0/(60+r.pos_vetor) else 0 end) desc,r.id
 limit least(greatest(coalesce(match_count,5),1),8)
$$;
revoke all on function public.buscar_biblioteca_hibrida(text,extensions.vector,integer,text) from public,anon;
grant execute on function public.buscar_biblioteca_hibrida(text,extensions.vector,integer,text) to authenticated;
CREATE OR REPLACE FUNCTION public.buscar_conhecimento_trading(query_embedding extensions.vector, match_count integer DEFAULT 5, filtro_categoria text DEFAULT NULL)
 RETURNS TABLE(titulo_obra text, autor text, tipo_fonte text, conteudo_chunk text, similarity double precision)
 LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO '' AS $$
 select k.titulo_obra,k.autor,k.tipo_fonte,k.conteudo_chunk,(1-(k.embedding OPERATOR(extensions.<=>) query_embedding))::double precision
 from public.conhecimento_trading k where k.owner_id=(select auth.uid()) and k.embedding is not null
 and (filtro_categoria is null or k.categoria=filtro_categoria)
 order by k.embedding OPERATOR(extensions.<=>) query_embedding limit least(greatest(coalesce(match_count,5),1),8)
 $$;
