-- Baseline do catálogo v580, 12/11/2026. Apenas estrutura; nenhum registro pessoal ou segredo.
-- Requer um projeto Supabase vazio (auth/storage e extensões gerenciadas já disponíveis).
-- Agendamentos ficam DESATIVADOS no ambiente restaurado até configurar segredos e validar isolamento.
create schema if not exists app_private;
revoke all on schema app_private from public,anon,authenticated;
create extension if not exists "supabase_vault" with schema "vault";
create extension if not exists "pg_cron" with schema "pg_catalog";
create extension if not exists "pg_net" with schema "extensions";
create sequence if not exists "public"."ewz_serie_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."ewz_boletas_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."operacoes_profit_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."carteira_relatorios_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."erros_app_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."panorama_fotos_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."automacao_log_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."analise_uso_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."profit_prints_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."movimentos_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."aulas_fila_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create sequence if not exists "public"."insiders_id_seq" as bigint start 1 increment 1 minvalue 1 maxvalue 9223372036854776000 cache 1;
create table if not exists "public"."resumos" (
 "id" uuid default gen_random_uuid() not null,
 "uid" uuid not null,
 "book_id" text not null,
 "titulo" text not null,
 "autor" text default ''::text not null,
 "foco" text default ''::text not null,
 "endpoint_id" text,
 "arquivo" text,
 "arquivo_bytes" bigint,
 "status" text default 'na_fila'::text not null,
 "tentativas" integer default 0 not null,
 "erro" text,
 "resultado" jsonb,
 "modelo" text,
 "criado" timestamp with time zone default now() not null,
 "atualizado" timestamp with time zone default now() not null,
 "concluido" timestamp with time zone,
 "modo" text default 'padrao'::text not null,
 "paginas" integer,
 "prompt" text default ''::text not null,
 "longo" jsonb,
 "progresso" jsonb,
 "extras" jsonb,
 "trava" timestamp with time zone
);
create table if not exists "public"."diario_backup" (
 "user_id" uuid not null,
 "dia" date not null,
 "data" jsonb not null,
 "criado" timestamp with time zone default now() not null
);
create table if not exists "public"."carteira_relatorios" (
 "id" bigint generated always as identity not null,
 "user_id" uuid not null,
 "tipo" text not null,
 "tk" text,
 "ref" date not null,
 "gerado" timestamp with time zone default now() not null,
 "fontes" jsonb,
 "dados_em" text,
 "modelo" text,
 "prompt_ver" text,
 "exec_id" uuid default gen_random_uuid() not null,
 "validacao" jsonb,
 "meta" jsonb,
 "conteudo" jsonb,
 "dados" jsonb
);
create table if not exists "public"."ewz_serie" (
 "id" bigint default nextval('ewz_serie_id_seq'::regclass) not null,
 "dia" date not null,
 "ts" timestamp with time zone default now() not null,
 "spot" numeric,
 "net_c" numeric,
 "net_p" numeric,
 "vol_c" bigint,
 "vol_p" bigint,
 "expo" numeric
);
create table if not exists "public"."ewz_boletas" (
 "id" bigint default nextval('ewz_boletas_id_seq'::regclass) not null,
 "dia" date not null,
 "ts" timestamp with time zone default now() not null,
 "sym" text,
 "venc" date,
 "tipo" text,
 "k" numeric,
 "dvol" integer,
 "preco" numeric,
 "premio" numeric,
 "lado" text,
 "oi" integer,
 "vol" integer,
 "delta" numeric,
 "expo" numeric
);
create table if not exists "public"."operacoes_profit" (
 "id" bigint generated always as identity not null,
 "user_id" uuid default auth.uid() not null,
 "id_externo" text not null,
 "conta" text,
 "ativo" text not null,
 "lado" text not null,
 "qtd" numeric not null,
 "preco_entrada" numeric not null,
 "preco_saida" numeric,
 "abertura" timestamp with time zone not null,
 "fechamento" timestamp with time zone,
 "resultado" numeric,
 "custos" numeric,
 "valor_ponto" numeric,
 "importado" boolean default false not null,
 "criado" timestamp with time zone default now() not null,
 "stop" numeric
);
create table if not exists "public"."ewz_estado" (
 "id" integer not null,
 "dia" date,
 "vols" jsonb,
 "net_c" numeric,
 "net_p" numeric,
 "ts" timestamp with time zone
);
create table if not exists "public"."ewz_iv" (
 "dia" date not null,
 "iv30" numeric,
 "hv20" numeric,
 "spot" numeric
);
create table if not exists "public"."ewz_oi" (
 "dia" date not null,
 "oi" jsonb
);
create table if not exists "public"."radar_cfg" (
 "user_id" uuid not null,
 "push" boolean default true not null,
 "score_min" integer default 75 not null,
 "ultima" timestamp with time zone,
 "analisados" integer,
 "pendentes" integer,
 "sinais" integer,
 "erro" text,
 "cripto" boolean default true not null
);
create table if not exists "public"."radar_sinais" (
 "user_id" uuid not null,
 "dia" date not null,
 "ticker" text not null,
 "lado" text not null,
 "score" integer not null,
 "setups" jsonb default '[]'::jsonb not null,
 "preco" numeric,
 "entrada" numeric,
 "stop" numeric,
 "alvo1" numeric,
 "alvo2" numeric,
 "rr" numeric,
 "rsi" numeric,
 "vol_rel" numeric,
 "tendencia" text,
 "contra" jsonb default '[]'::jsonb not null,
 "comentario" text,
 "ativo" boolean default true not null,
 "avisado" boolean default false not null,
 "primeiro" timestamp with time zone default now() not null,
 "atualizado" timestamp with time zone default now() not null,
 "fib" jsonb,
 "resultado" jsonb
);
create table if not exists "public"."radar_cache" (
 "ticker" text not null,
 "dia" date not null,
 "candles" jsonb not null
);
create table if not exists "public"."carteira_cfg" (
 "user_id" uuid default auth.uid() not null,
 "cfg" jsonb default '{}'::jsonb not null,
 "estado" jsonb,
 "atualizado" timestamp with time zone default now() not null
);
create table if not exists "public"."parceiro" (
 "user_id" uuid default auth.uid() not null,
 "token" text not null,
 "resumo" jsonb default '{}'::jsonb not null,
 "atualizado" timestamp with time zone default now() not null
);
create table if not exists "app_private"."aulas_consumo" (
 "id" uuid default gen_random_uuid() not null,
 "user_id" uuid not null,
 "dia" date not null,
 "acao" text not null,
 "chave" text not null,
 "criado" timestamp with time zone default now() not null,
 "concluido" timestamp with time zone
);
create table if not exists "public"."diario" (
 "user_id" uuid not null,
 "data" jsonb default '{}'::jsonb not null,
 "updated_at" timestamp with time zone default now() not null,
 "revision" bigint default 0 not null
);
create table if not exists "public"."fluxo_negocios" (
 "user_id" uuid not null,
 "trade_id" text not null,
 "ticker" text not null,
 "traded_at" timestamp with time zone not null,
 "price" numeric not null,
 "quantity" numeric not null,
 "side" text default 'unknown'::text not null,
 "buyer" text,
 "seller" text,
 "source" text not null,
 "received_at" timestamp with time zone default now() not null
);
create table if not exists "public"."push_subs" (
 "id" text not null,
 "sub" jsonb not null,
 "prefs" jsonb default '{}'::jsonb not null,
 "criado" timestamp with time zone default now() not null,
 "user_id" uuid
);
create table if not exists "public"."cotacoes" (
 "user_id" uuid not null,
 "ticker" text not null,
 "ult" numeric,
 "abe" numeric,
 "max" numeric,
 "min" numeric,
 "neg" numeric,
 "hor" text,
 "dat" text,
 "updated_at" timestamp with time zone default now() not null,
 "fec" numeric,
 "var" numeric,
 "ocp" numeric,
 "ovd" numeric,
 "qoc" numeric,
 "qov" numeric,
 "pex" numeric,
 "ven" text,
 "ivp" numeric,
 "cab" numeric
);
create table if not exists "public"."aulas" (
 "id" uuid default gen_random_uuid() not null,
 "user_id" uuid default auth.uid() not null,
 "livro" text not null,
 "numero" integer not null,
 "titulo" text not null,
 "capitulos" text default ''::text not null,
 "roteiro" jsonb not null,
 "progresso" jsonb default '{}'::jsonb not null,
 "criado_em" timestamp with time zone default now() not null,
 "atualizado_em" timestamp with time zone default now() not null,
 "status" text default 'pronta'::text not null,
 "erro" text
);
create table if not exists "public"."analise_cache" (
 "chave" text not null,
 "dia" date not null,
 "dados" jsonb not null,
 "criado" timestamp with time zone default now() not null
);
create table if not exists "public"."erros_app" (
 "id" bigint generated always as identity not null,
 "user_id" uuid default auth.uid() not null,
 "em" timestamp with time zone default now() not null,
 "versao" text,
 "tela" text,
 "msg" text not null,
 "pilha" text,
 "vezes" integer default 1 not null,
 "aparelho" text
);
create table if not exists "public"."automacao_log" (
 "id" bigint generated always as identity not null,
 "em" timestamp with time zone default now() not null,
 "tarefa" text not null,
 "ok" boolean default true not null,
 "detalhe" text,
 "ms" integer
);
create table if not exists "public"."opcoes_grade" (
 "user_id" uuid default auth.uid() not null,
 "ativo" text not null,
 "spot" numeric,
 "series" jsonb default '[]'::jsonb not null,
 "updated_at" timestamp with time zone default now() not null
);
create table if not exists "public"."panorama_fotos" (
 "id" bigint generated always as identity not null,
 "slot" text not null,
 "gerado" timestamp with time zone default now() not null,
 "dados" jsonb not null
);
create table if not exists "public"."aulas_teste_txt" (
 "id" integer not null,
 "t" text
);
create table if not exists "public"."mercado_cache" (
 "id" text not null,
 "payload" jsonb not null,
 "fetched_at" timestamp with time zone not null
);
create table if not exists "public"."analise_uso" (
 "id" bigint generated always as identity not null,
 "uid" uuid not null,
 "dia" date not null,
 "modo" text,
 "criado" timestamp with time zone default now() not null
);
create table if not exists "app_private"."mercado_requests" (
 "id" text not null,
 "request_id" bigint not null,
 "requested_at" timestamp with time zone default now() not null
);
create table if not exists "public"."aulas_teste" (
 "token" text not null,
 "uid" uuid not null,
 "expira" timestamp with time zone not null
);
create table if not exists "public"."aulas_audio_jobs" (
 "id" uuid default gen_random_uuid() not null,
 "user_id" uuid not null,
 "aula_id" uuid not null,
 "cena" integer not null,
 "voz" text not null,
 "estado" text not null,
 "caminho" text,
 "criado" timestamp with time zone default now() not null,
 "atualizado" timestamp with time zone default now() not null
);
create table if not exists "public"."aulas_imagens_jobs" (
 "id" uuid default gen_random_uuid() not null,
 "user_id" uuid not null,
 "aula_id" uuid not null,
 "cena" integer not null,
 "estado" text not null,
 "caminho" text,
 "criado" timestamp with time zone default now() not null,
 "atualizado" timestamp with time zone default now() not null
);
create table if not exists "public"."aulas_fila" (
 "id" bigint default nextval('aulas_fila_id_seq'::regclass) not null,
 "user_id" uuid not null,
 "aula_id" uuid not null,
 "idx" integer not null,
 "total" integer not null,
 "bloco" integer default 0,
 "blocos" integer default 1,
 "capitulo" text,
 "texto" text,
 "figuras" jsonb default '[]'::jsonb,
 "status" text default 'pendente'::text not null,
 "tentativas" integer default 0,
 "erro" text,
 "criado" timestamp with time zone default now(),
 "atualizado" timestamp with time zone default now()
);
create table if not exists "public"."profit_prints" (
 "id" bigint default nextval('profit_prints_id_seq'::regclass) not null,
 "user_id" uuid default auth.uid() not null,
 "chave" text not null,
 "tirada" timestamp with time zone not null,
 "arquivo" text,
 "usado" boolean default false,
 "criado" timestamp with time zone default now()
);
create table if not exists "public"."movimentos" (
 "id" bigint default nextval('movimentos_id_seq'::regclass) not null,
 "dia" date not null,
 "ativo" text,
 "simbolo" text,
 "variacao" numeric,
 "preco" numeric,
 "motivo" text,
 "manchetes" jsonb,
 "b3" text,
 "criado" timestamp with time zone default now()
);
create table if not exists "public"."insiders" (
 "id" bigint default nextval('insiders_id_seq'::regclass) not null,
 "empresa" text not null,
 "cnpj" text,
 "tickers" text,
 "mes" text not null,
 "cargo" text not null,
 "compras" numeric,
 "vendas" numeric,
 "liquido" numeric,
 "atualizado" timestamp with time zone default now()
);
create table if not exists "public"."fluxo_acoes" (
 "user_id" uuid default auth.uid() not null,
 "dia" date not null,
 "ativo" text not null,
 "ag_compra" numeric,
 "ag_venda" numeric,
 "est_compra" numeric,
 "est_venda" numeric,
 "negocios" integer,
 "amostras" integer,
 "ult" numeric,
 "atualizado" timestamp with time zone default now()
);
create table if not exists "public"."push_log" (
 "chave" text not null,
 "em" timestamp with time zone default now() not null,
 "status" text default 'enviado'::text not null,
 "subscription_id" text,
 "subscription_owner" uuid,
 "payload" jsonb,
 "attempts" integer default 0 not null,
 "next_attempt_at" timestamp with time zone,
 "locked_until" timestamp with time zone,
 "lease_id" uuid,
 "last_error" text,
 "sent_at" timestamp with time zone
);
alter table "public"."resumos" add constraint "resumos_modo_chk" CHECK ((modo = ANY (ARRAY['padrao'::text, 'completo'::text])));
alter table "public"."resumos" add constraint "resumos_pkey" PRIMARY KEY (id);
alter table "public"."resumos" add constraint "resumos_status_check" CHECK ((status = ANY (ARRAY['na_fila'::text, 'processando'::text, 'concluido'::text, 'erro'::text])));
alter table "public"."diario_backup" add constraint "diario_backup_pkey" PRIMARY KEY (user_id, dia);
alter table "public"."carteira_relatorios" add constraint "carteira_relatorios_pkey" PRIMARY KEY (id);
alter table "public"."carteira_relatorios" add constraint "carteira_relatorios_tipo_check" CHECK ((tipo = ANY (ARRAY['ativo'::text, 'consolidado'::text])));
alter table "public"."ewz_serie" add constraint "ewz_serie_pkey" PRIMARY KEY (id);
alter table "public"."ewz_boletas" add constraint "ewz_boletas_pkey" PRIMARY KEY (id);
alter table "public"."operacoes_profit" add constraint "operacoes_profit_lado_check" CHECK ((lado = ANY (ARRAY['C'::text, 'V'::text])));
alter table "public"."operacoes_profit" add constraint "operacoes_profit_pkey" PRIMARY KEY (id);
alter table "public"."operacoes_profit" add constraint "operacoes_profit_qtd_check" CHECK ((qtd > (0)::numeric));
alter table "public"."operacoes_profit" add constraint "operacoes_profit_user_id_id_externo_key" UNIQUE (user_id, id_externo);
alter table "public"."ewz_estado" add constraint "ewz_estado_pkey" PRIMARY KEY (id);
alter table "public"."ewz_iv" add constraint "ewz_iv_pkey" PRIMARY KEY (dia);
alter table "public"."ewz_oi" add constraint "ewz_oi_pkey" PRIMARY KEY (dia);
alter table "public"."radar_cfg" add constraint "radar_cfg_pkey" PRIMARY KEY (user_id);
alter table "public"."radar_cfg" add constraint "radar_cfg_score_min_check" CHECK (((score_min >= 40) AND (score_min <= 100)));
alter table "public"."radar_sinais" add constraint "radar_sinais_lado_check" CHECK ((lado = ANY (ARRAY['C'::text, 'V'::text])));
alter table "public"."radar_sinais" add constraint "radar_sinais_pkey" PRIMARY KEY (user_id, dia, ticker, lado);
alter table "public"."radar_cache" add constraint "radar_cache_pkey" PRIMARY KEY (ticker);
alter table "public"."carteira_cfg" add constraint "carteira_cfg_pkey" PRIMARY KEY (user_id);
alter table "public"."parceiro" add constraint "parceiro_pkey" PRIMARY KEY (user_id);
alter table "public"."parceiro" add constraint "parceiro_token_check" CHECK (((length(token) >= 20) AND (length(token) <= 40)));
alter table "public"."parceiro" add constraint "parceiro_token_key" UNIQUE (token);
alter table "app_private"."aulas_consumo" add constraint "aulas_consumo_acao_check" CHECK ((acao = ANY (ARRAY['iniciar'::text, 'parte'::text])));
alter table "app_private"."aulas_consumo" add constraint "aulas_consumo_pkey" PRIMARY KEY (id);
alter table "public"."diario" add constraint "diario_pkey" PRIMARY KEY (user_id);
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_buyer_check" CHECK ((length(buyer) <= 100));
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_pkey" PRIMARY KEY (user_id, trade_id);
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_price_check" CHECK (((price > (0)::numeric) AND (price < '1000000000000'::numeric)));
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_quantity_check" CHECK (((quantity > (0)::numeric) AND (quantity < '1000000000000000'::numeric)));
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_seller_check" CHECK ((length(seller) <= 100));
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_side_check" CHECK ((side = ANY (ARRAY['buy'::text, 'sell'::text, 'unknown'::text])));
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_source_check" CHECK ((source = ANY (ARRAY['Profit CSV'::text, 'Profit RTD'::text])));
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_ticker_check" CHECK ((ticker ~ '^[A-Z0-9.]{1,18}$'::text));
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_trade_id_check" CHECK ((trade_id ~ '^[a-f0-9]{64}$'::text));
alter table "public"."push_subs" add constraint "push_subs_pkey" PRIMARY KEY (id);
alter table "public"."cotacoes" add constraint "cotacoes_pkey" PRIMARY KEY (user_id, ticker);
alter table "public"."aulas" add constraint "aulas_pkey" PRIMARY KEY (id);
alter table "public"."aulas" add constraint "aulas_status_check" CHECK ((status = ANY (ARRAY['gerando'::text, 'pronta'::text, 'erro'::text])));
alter table "public"."aulas" add constraint "aulas_user_id_livro_numero_key" UNIQUE (user_id, livro, numero);
alter table "public"."analise_cache" add constraint "analise_cache_pkey" PRIMARY KEY (chave);
alter table "public"."erros_app" add constraint "erros_app_aparelho_check" CHECK ((char_length(aparelho) <= 200));
alter table "public"."erros_app" add constraint "erros_app_msg_check" CHECK ((char_length(msg) <= 400));
alter table "public"."erros_app" add constraint "erros_app_pilha_check" CHECK ((char_length(pilha) <= 1000));
alter table "public"."erros_app" add constraint "erros_app_pkey" PRIMARY KEY (id);
alter table "public"."erros_app" add constraint "erros_app_vezes_check" CHECK (((vezes >= 1) AND (vezes <= 10000)));
alter table "public"."automacao_log" add constraint "automacao_log_pkey" PRIMARY KEY (id);
alter table "public"."opcoes_grade" add constraint "opcoes_grade_pkey" PRIMARY KEY (user_id, ativo);
alter table "public"."panorama_fotos" add constraint "panorama_fotos_pkey" PRIMARY KEY (id);
alter table "public"."panorama_fotos" add constraint "panorama_fotos_slot_key" UNIQUE (slot);
alter table "public"."aulas_teste_txt" add constraint "aulas_teste_txt_pkey" PRIMARY KEY (id);
alter table "public"."mercado_cache" add constraint "mercado_cache_pkey" PRIMARY KEY (id);
alter table "public"."analise_uso" add constraint "analise_uso_pkey" PRIMARY KEY (id);
alter table "app_private"."mercado_requests" add constraint "mercado_requests_pkey" PRIMARY KEY (id);
alter table "public"."aulas_teste" add constraint "aulas_teste_pkey" PRIMARY KEY (token);
alter table "public"."aulas_audio_jobs" add constraint "aulas_audio_jobs_cena_check" CHECK (((cena >= 0) AND (cena < 300)));
alter table "public"."aulas_audio_jobs" add constraint "aulas_audio_jobs_estado_check" CHECK ((estado = ANY (ARRAY['gerando'::text, 'pronta'::text, 'erro'::text])));
alter table "public"."aulas_audio_jobs" add constraint "aulas_audio_jobs_pkey" PRIMARY KEY (id);
alter table "public"."aulas_audio_jobs" add constraint "aulas_audio_jobs_user_id_aula_id_cena_voz_key" UNIQUE (user_id, aula_id, cena, voz);
alter table "public"."aulas_audio_jobs" add constraint "aulas_audio_jobs_voz_check" CHECK ((voz = ANY (ARRAY['Kore'::text, 'Charon'::text, 'Aoede'::text, 'Fenrir'::text])));
alter table "public"."aulas_imagens_jobs" add constraint "aulas_imagens_jobs_cena_check" CHECK (((cena >= 0) AND (cena < 300)));
alter table "public"."aulas_imagens_jobs" add constraint "aulas_imagens_jobs_estado_check" CHECK ((estado = ANY (ARRAY['gerando'::text, 'pronta'::text, 'erro'::text])));
alter table "public"."aulas_imagens_jobs" add constraint "aulas_imagens_jobs_pkey" PRIMARY KEY (id);
alter table "public"."aulas_imagens_jobs" add constraint "aulas_imagens_jobs_unique" UNIQUE (user_id, aula_id, cena);
alter table "public"."aulas_fila" add constraint "aulas_fila_aula_id_idx_key" UNIQUE (aula_id, idx);
alter table "public"."aulas_fila" add constraint "aulas_fila_pkey" PRIMARY KEY (id);
alter table "public"."profit_prints" add constraint "profit_prints_pkey" PRIMARY KEY (id);
alter table "public"."movimentos" add constraint "movimentos_pkey" PRIMARY KEY (id);
alter table "public"."insiders" add constraint "insiders_empresa_mes_cargo_key" UNIQUE (empresa, mes, cargo);
alter table "public"."insiders" add constraint "insiders_pkey" PRIMARY KEY (id);
alter table "public"."fluxo_acoes" add constraint "fluxo_acoes_pkey" PRIMARY KEY (user_id, dia, ativo);
alter table "public"."push_log" add constraint "push_log_pkey" PRIMARY KEY (chave);
alter table "public"."resumos" add constraint "resumos_uid_fkey" FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."diario_backup" add constraint "diario_backup_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."carteira_relatorios" add constraint "carteira_relatorios_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."operacoes_profit" add constraint "operacoes_profit_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."radar_cfg" add constraint "radar_cfg_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."radar_sinais" add constraint "radar_sinais_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."carteira_cfg" add constraint "carteira_cfg_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."parceiro" add constraint "parceiro_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "app_private"."aulas_consumo" add constraint "aulas_consumo_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."diario" add constraint "diario_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."fluxo_negocios" add constraint "fluxo_negocios_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."push_subs" add constraint "push_subs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."cotacoes" add constraint "cotacoes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."aulas" add constraint "aulas_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."erros_app" add constraint "erros_app_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."opcoes_grade" add constraint "opcoes_grade_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."analise_uso" add constraint "analise_uso_uid_fkey" FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."aulas_fila" add constraint "aulas_fila_aula_id_fkey" FOREIGN KEY (aula_id) REFERENCES aulas(id) ON DELETE CASCADE;
alter table "public"."aulas_fila" add constraint "aulas_fila_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."profit_prints" add constraint "profit_prints_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."fluxo_acoes" add constraint "fluxo_acoes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX resumos_uid_idx ON public.resumos USING btree (uid, criado DESC);
CREATE INDEX resumos_status_idx ON public.resumos USING btree (status, atualizado);
CREATE INDEX carteira_relatorios_busca ON public.carteira_relatorios USING btree (user_id, tipo, tk, gerado DESC);
CREATE INDEX ewz_serie_dia ON public.ewz_serie USING btree (dia, ts);
CREATE INDEX ewz_boletas_dia ON public.ewz_boletas USING btree (dia, premio DESC);
CREATE INDEX operacoes_profit_pendentes ON public.operacoes_profit USING btree (user_id) WHERE (NOT importado);
CREATE INDEX aulas_consumo_uid_dia ON app_private.aulas_consumo USING btree (user_id, dia, acao);
CREATE UNIQUE INDEX aulas_consumo_um_ativo ON app_private.aulas_consumo USING btree (user_id, chave) WHERE (concluido IS NULL);
CREATE INDEX fluxo_negocios_ativo_data ON public.fluxo_negocios USING btree (user_id, ticker, traded_at DESC, trade_id DESC);
CREATE INDEX push_subs_user ON public.push_subs USING btree (user_id);
CREATE INDEX aulas_user_livro ON public.aulas USING btree (user_id, livro, numero);
CREATE INDEX analise_cache_dia_idx ON public.analise_cache USING btree (dia);
CREATE INDEX erros_app_user_em ON public.erros_app USING btree (user_id, em DESC);
CREATE INDEX automacao_log_em ON public.automacao_log USING btree (em DESC);
CREATE INDEX panorama_fotos_gerado ON public.panorama_fotos USING btree (gerado DESC);
CREATE INDEX analise_uso_uid_dia_idx ON public.analise_uso USING btree (uid, dia);
CREATE INDEX aulas_audio_jobs_quota ON public.aulas_audio_jobs USING btree (user_id, criado);
CREATE INDEX aulas_imagens_jobs_quota ON public.aulas_imagens_jobs USING btree (user_id, criado);
CREATE INDEX aulas_fila_status ON public.aulas_fila USING btree (status, criado);
CREATE INDEX aulas_fila_user_id_idx ON public.aulas_fila USING btree (user_id);
CREATE INDEX profit_prints_user ON public.profit_prints USING btree (user_id, usado, tirada);
CREATE INDEX movimentos_dia ON public.movimentos USING btree (dia DESC);
CREATE INDEX push_log_pendentes_idx ON public.push_log USING btree (next_attempt_at) WHERE ((status = ANY (ARRAY['pendente'::text, 'falhou'::text])) AND (attempts < 5));
alter table "public"."resumos" enable row level security;
revoke all on "public"."resumos" from anon,authenticated;
alter table "public"."diario_backup" enable row level security;
revoke all on "public"."diario_backup" from anon,authenticated;
alter table "public"."carteira_relatorios" enable row level security;
revoke all on "public"."carteira_relatorios" from anon,authenticated;
alter table "public"."ewz_serie" enable row level security;
revoke all on "public"."ewz_serie" from anon,authenticated;
alter table "public"."ewz_boletas" enable row level security;
revoke all on "public"."ewz_boletas" from anon,authenticated;
alter table "public"."operacoes_profit" enable row level security;
revoke all on "public"."operacoes_profit" from anon,authenticated;
alter table "public"."ewz_estado" enable row level security;
revoke all on "public"."ewz_estado" from anon,authenticated;
alter table "public"."ewz_iv" enable row level security;
revoke all on "public"."ewz_iv" from anon,authenticated;
alter table "public"."ewz_oi" enable row level security;
revoke all on "public"."ewz_oi" from anon,authenticated;
alter table "public"."radar_cfg" enable row level security;
revoke all on "public"."radar_cfg" from anon,authenticated;
alter table "public"."radar_sinais" enable row level security;
revoke all on "public"."radar_sinais" from anon,authenticated;
alter table "public"."radar_cache" enable row level security;
revoke all on "public"."radar_cache" from anon,authenticated;
alter table "public"."carteira_cfg" enable row level security;
revoke all on "public"."carteira_cfg" from anon,authenticated;
alter table "public"."parceiro" enable row level security;
revoke all on "public"."parceiro" from anon,authenticated;
alter table "app_private"."aulas_consumo" enable row level security;
revoke all on "app_private"."aulas_consumo" from anon,authenticated;
alter table "public"."diario" enable row level security;
revoke all on "public"."diario" from anon,authenticated;
alter table "public"."fluxo_negocios" enable row level security;
revoke all on "public"."fluxo_negocios" from anon,authenticated;
alter table "public"."push_subs" enable row level security;
revoke all on "public"."push_subs" from anon,authenticated;
alter table "public"."cotacoes" enable row level security;
revoke all on "public"."cotacoes" from anon,authenticated;
alter table "public"."aulas" enable row level security;
revoke all on "public"."aulas" from anon,authenticated;
alter table "public"."analise_cache" enable row level security;
revoke all on "public"."analise_cache" from anon,authenticated;
alter table "public"."erros_app" enable row level security;
revoke all on "public"."erros_app" from anon,authenticated;
alter table "public"."automacao_log" enable row level security;
revoke all on "public"."automacao_log" from anon,authenticated;
alter table "public"."opcoes_grade" enable row level security;
revoke all on "public"."opcoes_grade" from anon,authenticated;
alter table "public"."panorama_fotos" enable row level security;
revoke all on "public"."panorama_fotos" from anon,authenticated;
alter table "public"."aulas_teste_txt" enable row level security;
revoke all on "public"."aulas_teste_txt" from anon,authenticated;
alter table "public"."mercado_cache" enable row level security;
revoke all on "public"."mercado_cache" from anon,authenticated;
alter table "public"."analise_uso" enable row level security;
revoke all on "public"."analise_uso" from anon,authenticated;
alter table "app_private"."mercado_requests" enable row level security;
revoke all on "app_private"."mercado_requests" from anon,authenticated;
alter table "public"."aulas_teste" enable row level security;
revoke all on "public"."aulas_teste" from anon,authenticated;
alter table "public"."aulas_audio_jobs" enable row level security;
revoke all on "public"."aulas_audio_jobs" from anon,authenticated;
alter table "public"."aulas_imagens_jobs" enable row level security;
revoke all on "public"."aulas_imagens_jobs" from anon,authenticated;
alter table "public"."aulas_fila" enable row level security;
revoke all on "public"."aulas_fila" from anon,authenticated;
alter table "public"."profit_prints" enable row level security;
revoke all on "public"."profit_prints" from anon,authenticated;
alter table "public"."movimentos" enable row level security;
revoke all on "public"."movimentos" from anon,authenticated;
alter table "public"."insiders" enable row level security;
revoke all on "public"."insiders" from anon,authenticated;
alter table "public"."fluxo_acoes" enable row level security;
revoke all on "public"."fluxo_acoes" from anon,authenticated;
alter table "public"."push_log" enable row level security;
revoke all on "public"."push_log" from anon,authenticated;
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.analise_reservar_uso(p_uid uuid, p_dia date, p_modo text, p_limite integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare n bigint;
begin
 if p_uid is null or p_dia is null or p_limite is null or p_limite <= 0 then
  return false;
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_uid::text || ':' || p_dia::text, 0));
 select count(*) into n from public.analise_uso where uid=p_uid and dia=p_dia;
 if n >= p_limite then return false; end if;
 insert into public.analise_uso(uid,dia,modo) values(p_uid,p_dia,left(p_modo,50));
 return true;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.erros_app_limpa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  delete from public.erros_app where user_id = new.user_id and em < now() - interval '90 days';
  return new;
end $function$
;
CREATE OR REPLACE FUNCTION public.diario_salvar_cas(expected_data jsonb, new_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  caller uuid := auth.uid();
  current_data jsonb;
  affected integer;
begin
  if caller is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  if new_data is null or pg_catalog.jsonb_typeof(new_data) <> 'object' then
    raise exception 'Dados inválidos' using errcode = '22023';
  end if;
  select data into current_data from public.diario where user_id = caller for update;
  if not found then
    if expected_data is not null then return pg_catalog.jsonb_build_object('saved', false, 'data', null); end if;
    insert into public.diario(user_id, data, updated_at) values(caller, new_data, pg_catalog.clock_timestamp())
      on conflict(user_id) do nothing;
    get diagnostics affected = row_count;
    if affected = 1 then return pg_catalog.jsonb_build_object('saved', true); end if;
    select data into current_data from public.diario where user_id = caller for update;
    return pg_catalog.jsonb_build_object('saved', false, 'data', current_data);
  end if;
  if current_data is distinct from expected_data then
    return pg_catalog.jsonb_build_object('saved', false, 'data', current_data);
  end if;
  update public.diario set data = new_data, updated_at = pg_catalog.clock_timestamp() where user_id = caller;
  return pg_catalog.jsonb_build_object('saved', true);
end $function$
;
CREATE OR REPLACE FUNCTION app_private.mercado_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'app_private', 'net'
AS $function$
declare item record; j jsonb; syms jsonb; ds jsonb; m date; cols jsonb; code text; req bigint;
begin
 if not pg_try_advisory_xact_lock(3052026) then return; end if;
 for item in select q.id,r.content,r.created,r.status_code from app_private.mercado_requests q join net._http_response r on r.id=q.request_id loop
  begin
   if item.status_code=200 then
    j:=item.content::jsonb;
    if (item.id in ('quotes','di') and jsonb_typeof(j->'data')='array' and jsonb_array_length(j->'data')>0) or (item.id in ('cdi','selic','cdi_diario') and jsonb_typeof(j)='array' and jsonb_array_length(j)>0) then
     insert into public.mercado_cache values(item.id,j,item.created) on conflict(id) do update set payload=excluded.payload,fetched_at=excluded.fetched_at;
    end if;
   end if;
  exception when others then null;
  end;
 end loop;
 syms:='["BMFBOVESPA:IBOV","BMFBOVESPA:PETR4","BMFBOVESPA:VALE3","BMFBOVESPA:ITUB4","BMFBOVESPA:BBDC4","BMFBOVESPA:BBAS3","BMFBOVESPA:WEGE3","TVC:SPX","NASDAQ:NDX","DJ:DJI","FX_IDC:USDBRL","TVC:DXY","TVC:UKOIL","TVC:USOIL","TVC:GOLD","NASDAQ:AAPL","NASDAQ:MSFT","NASDAQ:NVDA","AMEX:SPY","AMEX:EWZ","NYSE:PBR","NYSE:VALE","NYSE:ITUB","NYSE:BBD","NYSE:ABEV","NYSE:GGB","NYSE:SID","NYSE:SUZ","BINANCE:BTCUSDT","BINANCE:ETHUSDT"]'::jsonb;
 cols:='["description","close","change","change_abs","update_mode","currency","update_time"]'::jsonb;
 req:=net.http_post(url:='https://scanner.tradingview.com/global/scan',body:=jsonb_build_object('symbols',jsonb_build_object('tickers',syms),'columns',cols),timeout_milliseconds:=10000);
 insert into app_private.mercado_requests(id,request_id,requested_at) values('quotes',req,now()) on conflict(id) do update set request_id=excluded.request_id,requested_at=excluded.requested_at;
 ds:='[]'::jsonb;
 for n in 0..18 loop
  m:=(date_trunc('month',now() at time zone 'America/Sao_Paulo')+(n||' month')::interval)::date;
  ds:=ds||jsonb_build_array('BMFBOVESPA:DI1'||substr('FGHJKMNQUVXZ',extract(month from m)::int,1)||extract(year from m)::int);
 end loop;
 req:=net.http_post(url:='https://scanner.tradingview.com/futures/scan',body:=jsonb_build_object('symbols',jsonb_build_object('tickers',ds),'columns','["close","change_abs","update_time"]'::jsonb),timeout_milliseconds:=10000);
 insert into app_private.mercado_requests(id,request_id,requested_at) values('di',req,now()) on conflict(id) do update set request_id=excluded.request_id,requested_at=excluded.requested_at;
 foreach code in array array['selic','cdi_diario'] loop
  if not exists(select 1 from public.mercado_cache c where c.id=code and c.fetched_at>now()-interval '3 hours') then
   req:=net.http_get(url:='https://api.bcb.gov.br/dados/serie/bcdata.sgs.'||(case when code='cdi' then '4389' when code='cdi_diario' then '12' else '432' end)||'/dados/ultimos/5?formato=json',timeout_milliseconds:=15000);
   insert into app_private.mercado_requests(id,request_id,requested_at) values(code,req,now()) on conflict(id) do update set request_id=excluded.request_id,requested_at=excluded.requested_at;
  end if;
 end loop;
end $function$
;
CREATE OR REPLACE FUNCTION public.aulas_reservar_uso(p_uid uuid, p_acao text, p_chave text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare d date := (now() at time zone 'America/Sao_Paulo')::date; n integer; lim integer; r uuid;
begin
 if p_uid is null or p_acao not in ('iniciar','parte') or length(coalesce(p_chave,'')) not between 1 and 240 then raise exception 'Reserva inválida'; end if;
 lim := case when p_acao='iniciar' then 6 else 80 end;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_uid::text || ':aulas',0));
 -- Uma chamada de IA tem prazo máximo menor que cinco minutos; liberar apenas leases abandonados.
 update app_private.aulas_consumo set concluido=now() where user_id=p_uid and concluido is null and criado<now()-interval '5 minutes';
 if exists(select 1 from app_private.aulas_consumo where user_id=p_uid and chave=p_chave and concluido is null) then
  return jsonb_build_object('permitido',false,'motivo','em_andamento');
 end if;
 select count(*) into n from app_private.aulas_consumo where user_id=p_uid and dia=d and acao=p_acao;
 if n>=lim then return jsonb_build_object('permitido',false,'motivo','limite','limite',lim); end if;
 insert into app_private.aulas_consumo(user_id,dia,acao,chave) values(p_uid,d,p_acao,p_chave) returning id into r;
 return jsonb_build_object('permitido',true,'id',r);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.aulas_finalizar_uso(p_uid uuid, p_id uuid)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
 update app_private.aulas_consumo set concluido=now() where id=p_id and user_id=p_uid and concluido is null;
$function$
;
CREATE OR REPLACE FUNCTION public.parceiro_ver(t text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  SELECT partner_internal.parceiro_ver_impl(t)
$function$
;
CREATE OR REPLACE FUNCTION app_private.fluxo_tick()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'app_private', 'net'
AS $function$
declare item record; req bigint; c text; i int; j int;
begin
  for item in select r.content, r.created, r.status_code from app_private.mercado_requests q join net._http_response r on r.id=q.request_id where q.id='fluxo' loop
    if item.status_code=200 then
      i := strpos(item.content, '<tbody'); j := strpos(item.content, '</tbody>');
      if i>0 and j>i then
        c := substr(item.content, i, least(j-i+8, 200000));
        insert into public.mercado_cache values('fluxo', jsonb_build_object('html', c), item.created) on conflict(id) do update set payload=excluded.payload, fetched_at=excluded.fetched_at;
      end if;
    end if;
  end loop;
  req := net.http_get(url:='https://www.dadosdemercado.com.br/fluxo', headers:='{"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15","Accept":"text/html"}'::jsonb, timeout_milliseconds:=15000);
  insert into app_private.mercado_requests(id,request_id,requested_at) values('fluxo',req,now()) on conflict(id) do update set request_id=excluded.request_id, requested_at=excluded.requested_at;
end $function$
;
CREATE OR REPLACE FUNCTION public.diario_incrementar_revisao()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin new.revision := old.revision + 1; return new; end;
$function$
;
CREATE OR REPLACE FUNCTION public.diario_salvar_revisao(expected_revision bigint, new_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
 SET lock_timeout TO '3s'
AS $function$
declare caller uuid := auth.uid(); saved_revision bigint; current_data jsonb;
begin
  if caller is null then raise exception 'Sessão necessária' using errcode = '42501'; end if;
  if new_data is null or jsonb_typeof(new_data) <> 'object' then raise exception 'Dados inválidos' using errcode = '22023'; end if;
  if expected_revision is null then
    insert into public.diario(user_id,data,updated_at,revision) values(caller,new_data,clock_timestamp(),1)
      on conflict(user_id) do nothing returning revision into saved_revision;
  else
    update public.diario set data = new_data, updated_at = clock_timestamp()
      where user_id = caller and revision = expected_revision returning revision into saved_revision;
  end if;
  if saved_revision is not null then return jsonb_build_object('saved',true,'revision',saved_revision); end if;
  select data,revision into current_data,saved_revision from public.diario where user_id = caller;
  return jsonb_build_object('saved',false,'data',current_data,'revision',saved_revision);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.push_reservar(p_chave text, p_subscription text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare lease uuid;
begin
  insert into public.push_log(chave,status,subscription_id,subscription_owner,payload,next_attempt_at)
    select p_chave,'pendente',p_subscription,s.user_id,p_payload,now() from public.push_subs s where s.id=p_subscription
    on conflict(chave) do nothing;
  update public.push_log set locked_until = now() + interval '2 minutes',lease_id = gen_random_uuid(),attempts = attempts + 1
    where chave = p_chave and status in ('pendente','falhou') and attempts < 5
      and em > now() - interval '15 minutes' and next_attempt_at <= now()
      and (locked_until is null or locked_until < now()) returning lease_id into lease;
  return jsonb_build_object('reservado',lease is not null,'lease',lease);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.push_concluir(p_chave text, p_lease uuid, p_ok boolean, p_erro text DEFAULT NULL::text, p_invalida boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare affected integer;
begin
  update public.push_log set status = case when p_ok then 'enviado' when p_invalida then 'descartado' else 'falhou' end,
    sent_at = case when p_ok then now() else sent_at end,
    last_error = case when p_ok then null else left(p_erro,300) end,
    next_attempt_at = case when p_ok or p_invalida then null else now() + make_interval(secs => least(480,30 * (2 ^ least(attempts,4))::integer)) end,
    locked_until = null,lease_id = null where chave = p_chave and lease_id = p_lease;
  get diagnostics affected = row_count; return affected = 1;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.push_retentar_lote(p_limit integer DEFAULT 12)
 RETURNS TABLE(chave text, subscription_id text, subscription_owner uuid, payload jsonb, lease_id uuid)
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  with candidatos as (
    select p.chave from public.push_log p where p.status in ('pendente','falhou') and p.attempts < 5
      and p.em > now() - interval '15 minutes' and p.next_attempt_at <= now()
      and (p.locked_until is null or p.locked_until < now())
      order by p.next_attempt_at limit greatest(1,least(p_limit,30)) for update skip locked
  )
  update public.push_log p set locked_until = now() + interval '2 minutes',lease_id = gen_random_uuid(),attempts = p.attempts + 1
    from candidatos c where p.chave = c.chave returning p.chave,p.subscription_id,p.subscription_owner,p.payload,p.lease_id;
$function$
;
CREATE TRIGGER erros_app_limpa AFTER INSERT ON public.erros_app FOR EACH ROW EXECUTE FUNCTION erros_app_limpa();
CREATE TRIGGER diario_revisao BEFORE UPDATE ON public.diario FOR EACH ROW EXECUTE FUNCTION diario_incrementar_revisao();
create policy "fotos_select_own" on "storage"."objects" as PERMISSIVE for SELECT to "authenticated" using (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "fotos_insert_own" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "fotos_update_own" on "storage"."objects" as PERMISSIVE for UPDATE to "authenticated" using (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) with check (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "fotos_delete_own" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "livros_insert_proprios" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'livros'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "livros_select_proprios" on "storage"."objects" as PERMISSIVE for SELECT to "authenticated" using (((bucket_id = 'livros'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "livros_delete_proprios" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'livros'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "resumos_select_proprios" on "public"."resumos" as PERMISSIVE for SELECT to "authenticated" using ((uid = ( SELECT auth.uid() AS uid)));
create policy "fotos_ler_proprias" on "storage"."objects" as PERMISSIVE for SELECT to "authenticated" using (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "fotos_enviar_proprias" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "fotos_trocar_proprias" on "storage"."objects" as PERMISSIVE for UPDATE to "authenticated" using (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) with check (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "fotos_apagar_proprias" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'fotos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "panorama leitura" on "public"."panorama_fotos" as PERMISSIVE for SELECT to "authenticated" using (true);
create policy "automacao leitura" on "public"."automacao_log" as PERMISSIVE for SELECT to "authenticated" using (true);
create policy "opc_alterar" on "public"."opcoes_grade" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "fluxo_ler" on "public"."fluxo_negocios" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));
create policy "fluxo_inserir" on "public"."fluxo_negocios" as PERMISSIVE for INSERT to "authenticated" with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "fluxo_atualizar" on "public"."fluxo_negocios" as PERMISSIVE for UPDATE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "mercado_cache_ler" on "public"."mercado_cache" as PERMISSIVE for SELECT to "authenticated" using (true);
create policy "aulas: ler as minhas" on "public"."aulas" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));
create policy "aulas: criar as minhas" on "public"."aulas" as PERMISSIVE for INSERT to "authenticated" with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "aulas: alterar as minhas" on "public"."aulas" as PERMISSIVE for UPDATE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "aulas: apagar as minhas" on "public"."aulas" as PERMISSIVE for DELETE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));
create policy "diario_alterar_proprio" on "public"."diario" as PERMISSIVE for UPDATE to "authenticated" using (((user_id)::text = (( SELECT auth.uid() AS uid))::text)) with check (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "diario_apagar_proprio" on "public"."diario" as PERMISSIVE for DELETE to "authenticated" using (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "diario_backup_ler_proprio" on "public"."diario_backup" as PERMISSIVE for SELECT to "authenticated" using (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "aulas_figuras_update_proprios" on "storage"."objects" as PERMISSIVE for UPDATE to "authenticated" using (((bucket_id = 'aulas-figuras'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) with check (((bucket_id = 'aulas-figuras'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "diario_backup_criar_proprio" on "public"."diario_backup" as PERMISSIVE for INSERT to "authenticated" with check (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "diario_backup_alterar_proprio" on "public"."diario_backup" as PERMISSIVE for UPDATE to "authenticated" using (((user_id)::text = (( SELECT auth.uid() AS uid))::text)) with check (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "diario_backup_apagar_proprio" on "public"."diario_backup" as PERMISSIVE for DELETE to "authenticated" using (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "diario_ler_proprio" on "public"."diario" as PERMISSIVE for SELECT to "authenticated" using (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "diario_criar_proprio" on "public"."diario" as PERMISSIVE for INSERT to "authenticated" with check (((user_id)::text = (( SELECT auth.uid() AS uid))::text));
create policy "resumos_delete_proprios" on "public"."resumos" as PERMISSIVE for DELETE to "authenticated" using ((uid = ( SELECT auth.uid() AS uid)));
create policy "opc_ler" on "public"."opcoes_grade" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "opc_criar" on "public"."opcoes_grade" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "op_profit_ler" on "public"."operacoes_profit" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "op_profit_criar" on "public"."operacoes_profit" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "op_profit_alterar" on "public"."operacoes_profit" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "op_profit_apagar" on "public"."operacoes_profit" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "radar_ler" on "public"."radar_sinais" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "radar_cfg_ler" on "public"."radar_cfg" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "radar_cfg_criar" on "public"."radar_cfg" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "radar_cfg_alterar" on "public"."radar_cfg" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "cotacoes_ler_proprias" on "public"."cotacoes" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "cotacoes_criar_proprias" on "public"."cotacoes" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "carteira_relatorios ler os meus" on "public"."carteira_relatorios" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));
create policy "cotacoes_alterar_proprias" on "public"."cotacoes" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "cotacoes_apagar_proprias" on "public"."cotacoes" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "opc_apagar" on "public"."opcoes_grade" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "parceiro_ler" on "public"."parceiro" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "parceiro_criar" on "public"."parceiro" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "parceiro_alterar" on "public"."parceiro" as PERMISSIVE for UPDATE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "parceiro_apagar" on "public"."parceiro" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "erros_ler" on "public"."erros_app" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "erros_criar" on "public"."erros_app" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "erros_apagar" on "public"."erros_app" as PERMISSIVE for DELETE to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "carteira_relatorios apagar os meus" on "public"."carteira_relatorios" as PERMISSIVE for DELETE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));
create policy "carteira_cfg ler a minha" on "public"."carteira_cfg" as PERMISSIVE for SELECT to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id));
create policy "carteira_cfg criar a minha" on "public"."carteira_cfg" as PERMISSIVE for INSERT to "authenticated" with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "carteira_cfg mudar a minha" on "public"."carteira_cfg" as PERMISSIVE for UPDATE to "authenticated" using ((( SELECT auth.uid() AS uid) = user_id)) with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "aulas_videos_select_proprios" on "storage"."objects" as PERMISSIVE for SELECT to "authenticated" using (((bucket_id = 'aulas-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "aulas_videos_insert_proprios" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'aulas-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "aulas_videos_update_proprios" on "storage"."objects" as PERMISSIVE for UPDATE to "authenticated" using (((bucket_id = 'aulas-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) with check (((bucket_id = 'aulas-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "aulas_videos_delete_proprios" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'aulas-videos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "aulas_figuras_select_proprios" on "storage"."objects" as PERMISSIVE for SELECT to "authenticated" using (((bucket_id = 'aulas-figuras'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "aulas_figuras_insert_proprios" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'aulas-figuras'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "aulas_figuras_delete_proprios" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'aulas-figuras'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "backups_select_proprios" on "storage"."objects" as PERMISSIVE for SELECT to "authenticated" using (((bucket_id = 'backups'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "backups_insert_proprios" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'backups'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "backups_update_proprios" on "storage"."objects" as PERMISSIVE for UPDATE to "authenticated" using (((bucket_id = 'backups'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text))) with check (((bucket_id = 'backups'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "backups_delete_proprios" on "storage"."objects" as PERMISSIVE for DELETE to "authenticated" using (((bucket_id = 'backups'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
create policy "aulas_fila_le" on "public"."aulas_fila" as PERMISSIVE for SELECT to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "profit_prints_dono" on "public"."profit_prints" as PERMISSIVE for ALL to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "planilhas_ins" on "storage"."objects" as PERMISSIVE for INSERT to "authenticated" with check (((bucket_id = 'planilhas'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
create policy "planilhas_upd" on "storage"."objects" as PERMISSIVE for UPDATE to "authenticated" using (((bucket_id = 'planilhas'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
create policy "planilhas_sel" on "storage"."objects" as PERMISSIVE for SELECT to "authenticated" using (((bucket_id = 'planilhas'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
create policy "movimentos_le" on "public"."movimentos" as PERMISSIVE for SELECT to "authenticated" using (true);
create policy "insiders_le" on "public"."insiders" as PERMISSIVE for SELECT to "authenticated" using (true);
create policy "fluxo_acoes_dono" on "public"."fluxo_acoes" as PERMISSIVE for ALL to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
grant SELECT on "public"."resumos" to "authenticated";
grant DELETE on "public"."resumos" to "authenticated";
grant TRUNCATE on "public"."resumos" to "authenticated";
grant REFERENCES on "public"."resumos" to "authenticated";
grant TRIGGER on "public"."resumos" to "authenticated";
grant INSERT on "public"."resumos" to "service_role";
grant SELECT on "public"."resumos" to "service_role";
grant UPDATE on "public"."resumos" to "service_role";
grant DELETE on "public"."resumos" to "service_role";
grant TRUNCATE on "public"."resumos" to "service_role";
grant REFERENCES on "public"."resumos" to "service_role";
grant TRIGGER on "public"."resumos" to "service_role";
grant INSERT on "public"."diario_backup" to "authenticated";
grant SELECT on "public"."diario_backup" to "authenticated";
grant UPDATE on "public"."diario_backup" to "authenticated";
grant DELETE on "public"."diario_backup" to "authenticated";
grant TRUNCATE on "public"."diario_backup" to "authenticated";
grant REFERENCES on "public"."diario_backup" to "authenticated";
grant TRIGGER on "public"."diario_backup" to "authenticated";
grant INSERT on "public"."diario_backup" to "service_role";
grant SELECT on "public"."diario_backup" to "service_role";
grant UPDATE on "public"."diario_backup" to "service_role";
grant DELETE on "public"."diario_backup" to "service_role";
grant TRUNCATE on "public"."diario_backup" to "service_role";
grant REFERENCES on "public"."diario_backup" to "service_role";
grant TRIGGER on "public"."diario_backup" to "service_role";
grant INSERT on "public"."carteira_relatorios" to "authenticated";
grant SELECT on "public"."carteira_relatorios" to "authenticated";
grant UPDATE on "public"."carteira_relatorios" to "authenticated";
grant DELETE on "public"."carteira_relatorios" to "authenticated";
grant TRUNCATE on "public"."carteira_relatorios" to "authenticated";
grant REFERENCES on "public"."carteira_relatorios" to "authenticated";
grant TRIGGER on "public"."carteira_relatorios" to "authenticated";
grant INSERT on "public"."carteira_relatorios" to "service_role";
grant SELECT on "public"."carteira_relatorios" to "service_role";
grant UPDATE on "public"."carteira_relatorios" to "service_role";
grant DELETE on "public"."carteira_relatorios" to "service_role";
grant TRUNCATE on "public"."carteira_relatorios" to "service_role";
grant REFERENCES on "public"."carteira_relatorios" to "service_role";
grant TRIGGER on "public"."carteira_relatorios" to "service_role";
grant INSERT on "public"."ewz_serie" to "authenticated";
grant SELECT on "public"."ewz_serie" to "authenticated";
grant UPDATE on "public"."ewz_serie" to "authenticated";
grant DELETE on "public"."ewz_serie" to "authenticated";
grant TRUNCATE on "public"."ewz_serie" to "authenticated";
grant REFERENCES on "public"."ewz_serie" to "authenticated";
grant TRIGGER on "public"."ewz_serie" to "authenticated";
grant INSERT on "public"."ewz_serie" to "service_role";
grant SELECT on "public"."ewz_serie" to "service_role";
grant UPDATE on "public"."ewz_serie" to "service_role";
grant DELETE on "public"."ewz_serie" to "service_role";
grant TRUNCATE on "public"."ewz_serie" to "service_role";
grant REFERENCES on "public"."ewz_serie" to "service_role";
grant TRIGGER on "public"."ewz_serie" to "service_role";
grant INSERT on "public"."ewz_boletas" to "authenticated";
grant SELECT on "public"."ewz_boletas" to "authenticated";
grant UPDATE on "public"."ewz_boletas" to "authenticated";
grant DELETE on "public"."ewz_boletas" to "authenticated";
grant TRUNCATE on "public"."ewz_boletas" to "authenticated";
grant REFERENCES on "public"."ewz_boletas" to "authenticated";
grant TRIGGER on "public"."ewz_boletas" to "authenticated";
grant INSERT on "public"."ewz_boletas" to "service_role";
grant SELECT on "public"."ewz_boletas" to "service_role";
grant UPDATE on "public"."ewz_boletas" to "service_role";
grant DELETE on "public"."ewz_boletas" to "service_role";
grant TRUNCATE on "public"."ewz_boletas" to "service_role";
grant REFERENCES on "public"."ewz_boletas" to "service_role";
grant TRIGGER on "public"."ewz_boletas" to "service_role";
grant INSERT on "public"."operacoes_profit" to "authenticated";
grant SELECT on "public"."operacoes_profit" to "authenticated";
grant UPDATE on "public"."operacoes_profit" to "authenticated";
grant DELETE on "public"."operacoes_profit" to "authenticated";
grant TRUNCATE on "public"."operacoes_profit" to "authenticated";
grant REFERENCES on "public"."operacoes_profit" to "authenticated";
grant TRIGGER on "public"."operacoes_profit" to "authenticated";
grant INSERT on "public"."operacoes_profit" to "service_role";
grant SELECT on "public"."operacoes_profit" to "service_role";
grant UPDATE on "public"."operacoes_profit" to "service_role";
grant DELETE on "public"."operacoes_profit" to "service_role";
grant TRUNCATE on "public"."operacoes_profit" to "service_role";
grant REFERENCES on "public"."operacoes_profit" to "service_role";
grant TRIGGER on "public"."operacoes_profit" to "service_role";
grant INSERT on "public"."ewz_estado" to "authenticated";
grant SELECT on "public"."ewz_estado" to "authenticated";
grant UPDATE on "public"."ewz_estado" to "authenticated";
grant DELETE on "public"."ewz_estado" to "authenticated";
grant TRUNCATE on "public"."ewz_estado" to "authenticated";
grant REFERENCES on "public"."ewz_estado" to "authenticated";
grant TRIGGER on "public"."ewz_estado" to "authenticated";
grant INSERT on "public"."ewz_estado" to "service_role";
grant SELECT on "public"."ewz_estado" to "service_role";
grant UPDATE on "public"."ewz_estado" to "service_role";
grant DELETE on "public"."ewz_estado" to "service_role";
grant TRUNCATE on "public"."ewz_estado" to "service_role";
grant REFERENCES on "public"."ewz_estado" to "service_role";
grant TRIGGER on "public"."ewz_estado" to "service_role";
grant INSERT on "public"."ewz_iv" to "authenticated";
grant SELECT on "public"."ewz_iv" to "authenticated";
grant UPDATE on "public"."ewz_iv" to "authenticated";
grant DELETE on "public"."ewz_iv" to "authenticated";
grant TRUNCATE on "public"."ewz_iv" to "authenticated";
grant REFERENCES on "public"."ewz_iv" to "authenticated";
grant TRIGGER on "public"."ewz_iv" to "authenticated";
grant INSERT on "public"."ewz_iv" to "service_role";
grant SELECT on "public"."ewz_iv" to "service_role";
grant UPDATE on "public"."ewz_iv" to "service_role";
grant DELETE on "public"."ewz_iv" to "service_role";
grant TRUNCATE on "public"."ewz_iv" to "service_role";
grant REFERENCES on "public"."ewz_iv" to "service_role";
grant TRIGGER on "public"."ewz_iv" to "service_role";
grant INSERT on "public"."ewz_oi" to "authenticated";
grant SELECT on "public"."ewz_oi" to "authenticated";
grant UPDATE on "public"."ewz_oi" to "authenticated";
grant DELETE on "public"."ewz_oi" to "authenticated";
grant TRUNCATE on "public"."ewz_oi" to "authenticated";
grant REFERENCES on "public"."ewz_oi" to "authenticated";
grant TRIGGER on "public"."ewz_oi" to "authenticated";
grant INSERT on "public"."ewz_oi" to "service_role";
grant SELECT on "public"."ewz_oi" to "service_role";
grant UPDATE on "public"."ewz_oi" to "service_role";
grant DELETE on "public"."ewz_oi" to "service_role";
grant TRUNCATE on "public"."ewz_oi" to "service_role";
grant REFERENCES on "public"."ewz_oi" to "service_role";
grant TRIGGER on "public"."ewz_oi" to "service_role";
grant INSERT on "public"."radar_cfg" to "authenticated";
grant SELECT on "public"."radar_cfg" to "authenticated";
grant UPDATE on "public"."radar_cfg" to "authenticated";
grant TRUNCATE on "public"."radar_cfg" to "authenticated";
grant REFERENCES on "public"."radar_cfg" to "authenticated";
grant TRIGGER on "public"."radar_cfg" to "authenticated";
grant INSERT on "public"."radar_cfg" to "service_role";
grant SELECT on "public"."radar_cfg" to "service_role";
grant UPDATE on "public"."radar_cfg" to "service_role";
grant DELETE on "public"."radar_cfg" to "service_role";
grant TRUNCATE on "public"."radar_cfg" to "service_role";
grant REFERENCES on "public"."radar_cfg" to "service_role";
grant TRIGGER on "public"."radar_cfg" to "service_role";
grant SELECT on "public"."radar_sinais" to "authenticated";
grant TRUNCATE on "public"."radar_sinais" to "authenticated";
grant REFERENCES on "public"."radar_sinais" to "authenticated";
grant TRIGGER on "public"."radar_sinais" to "authenticated";
grant INSERT on "public"."radar_sinais" to "service_role";
grant SELECT on "public"."radar_sinais" to "service_role";
grant UPDATE on "public"."radar_sinais" to "service_role";
grant DELETE on "public"."radar_sinais" to "service_role";
grant TRUNCATE on "public"."radar_sinais" to "service_role";
grant REFERENCES on "public"."radar_sinais" to "service_role";
grant TRIGGER on "public"."radar_sinais" to "service_role";
grant INSERT on "public"."radar_cache" to "service_role";
grant SELECT on "public"."radar_cache" to "service_role";
grant UPDATE on "public"."radar_cache" to "service_role";
grant DELETE on "public"."radar_cache" to "service_role";
grant TRUNCATE on "public"."radar_cache" to "service_role";
grant REFERENCES on "public"."radar_cache" to "service_role";
grant TRIGGER on "public"."radar_cache" to "service_role";
grant INSERT on "public"."carteira_cfg" to "authenticated";
grant SELECT on "public"."carteira_cfg" to "authenticated";
grant UPDATE on "public"."carteira_cfg" to "authenticated";
grant DELETE on "public"."carteira_cfg" to "authenticated";
grant TRUNCATE on "public"."carteira_cfg" to "authenticated";
grant REFERENCES on "public"."carteira_cfg" to "authenticated";
grant TRIGGER on "public"."carteira_cfg" to "authenticated";
grant INSERT on "public"."carteira_cfg" to "service_role";
grant SELECT on "public"."carteira_cfg" to "service_role";
grant UPDATE on "public"."carteira_cfg" to "service_role";
grant DELETE on "public"."carteira_cfg" to "service_role";
grant TRUNCATE on "public"."carteira_cfg" to "service_role";
grant REFERENCES on "public"."carteira_cfg" to "service_role";
grant TRIGGER on "public"."carteira_cfg" to "service_role";
grant INSERT on "public"."parceiro" to "authenticated";
grant SELECT on "public"."parceiro" to "authenticated";
grant UPDATE on "public"."parceiro" to "authenticated";
grant DELETE on "public"."parceiro" to "authenticated";
grant TRUNCATE on "public"."parceiro" to "authenticated";
grant REFERENCES on "public"."parceiro" to "authenticated";
grant TRIGGER on "public"."parceiro" to "authenticated";
grant INSERT on "public"."parceiro" to "service_role";
grant SELECT on "public"."parceiro" to "service_role";
grant UPDATE on "public"."parceiro" to "service_role";
grant DELETE on "public"."parceiro" to "service_role";
grant TRUNCATE on "public"."parceiro" to "service_role";
grant REFERENCES on "public"."parceiro" to "service_role";
grant TRIGGER on "public"."parceiro" to "service_role";
grant INSERT on "app_private"."aulas_consumo" to "service_role";
grant SELECT on "app_private"."aulas_consumo" to "service_role";
grant UPDATE on "app_private"."aulas_consumo" to "service_role";
grant INSERT on "public"."diario" to "authenticated";
grant SELECT on "public"."diario" to "authenticated";
grant UPDATE on "public"."diario" to "authenticated";
grant DELETE on "public"."diario" to "authenticated";
grant TRUNCATE on "public"."diario" to "authenticated";
grant REFERENCES on "public"."diario" to "authenticated";
grant TRIGGER on "public"."diario" to "authenticated";
grant INSERT on "public"."diario" to "service_role";
grant SELECT on "public"."diario" to "service_role";
grant UPDATE on "public"."diario" to "service_role";
grant DELETE on "public"."diario" to "service_role";
grant TRUNCATE on "public"."diario" to "service_role";
grant REFERENCES on "public"."diario" to "service_role";
grant TRIGGER on "public"."diario" to "service_role";
grant INSERT on "public"."fluxo_negocios" to "service_role";
grant SELECT on "public"."fluxo_negocios" to "service_role";
grant UPDATE on "public"."fluxo_negocios" to "service_role";
grant DELETE on "public"."fluxo_negocios" to "service_role";
grant TRUNCATE on "public"."fluxo_negocios" to "service_role";
grant REFERENCES on "public"."fluxo_negocios" to "service_role";
grant TRIGGER on "public"."fluxo_negocios" to "service_role";
grant INSERT on "public"."fluxo_negocios" to "authenticated";
grant SELECT on "public"."fluxo_negocios" to "authenticated";
grant UPDATE on "public"."fluxo_negocios" to "authenticated";
grant INSERT on "public"."push_subs" to "service_role";
grant SELECT on "public"."push_subs" to "service_role";
grant UPDATE on "public"."push_subs" to "service_role";
grant DELETE on "public"."push_subs" to "service_role";
grant TRUNCATE on "public"."push_subs" to "service_role";
grant REFERENCES on "public"."push_subs" to "service_role";
grant TRIGGER on "public"."push_subs" to "service_role";
grant INSERT on "public"."cotacoes" to "authenticated";
grant SELECT on "public"."cotacoes" to "authenticated";
grant UPDATE on "public"."cotacoes" to "authenticated";
grant DELETE on "public"."cotacoes" to "authenticated";
grant TRUNCATE on "public"."cotacoes" to "authenticated";
grant REFERENCES on "public"."cotacoes" to "authenticated";
grant TRIGGER on "public"."cotacoes" to "authenticated";
grant INSERT on "public"."cotacoes" to "service_role";
grant SELECT on "public"."cotacoes" to "service_role";
grant UPDATE on "public"."cotacoes" to "service_role";
grant DELETE on "public"."cotacoes" to "service_role";
grant TRUNCATE on "public"."cotacoes" to "service_role";
grant REFERENCES on "public"."cotacoes" to "service_role";
grant TRIGGER on "public"."cotacoes" to "service_role";
grant INSERT on "public"."aulas" to "authenticated";
grant SELECT on "public"."aulas" to "authenticated";
grant UPDATE on "public"."aulas" to "authenticated";
grant DELETE on "public"."aulas" to "authenticated";
grant TRUNCATE on "public"."aulas" to "authenticated";
grant REFERENCES on "public"."aulas" to "authenticated";
grant TRIGGER on "public"."aulas" to "authenticated";
grant INSERT on "public"."aulas" to "service_role";
grant SELECT on "public"."aulas" to "service_role";
grant UPDATE on "public"."aulas" to "service_role";
grant DELETE on "public"."aulas" to "service_role";
grant TRUNCATE on "public"."aulas" to "service_role";
grant REFERENCES on "public"."aulas" to "service_role";
grant TRIGGER on "public"."aulas" to "service_role";
grant INSERT on "public"."analise_cache" to "service_role";
grant SELECT on "public"."analise_cache" to "service_role";
grant UPDATE on "public"."analise_cache" to "service_role";
grant DELETE on "public"."analise_cache" to "service_role";
grant TRUNCATE on "public"."analise_cache" to "service_role";
grant REFERENCES on "public"."analise_cache" to "service_role";
grant TRIGGER on "public"."analise_cache" to "service_role";
grant INSERT on "public"."erros_app" to "authenticated";
grant SELECT on "public"."erros_app" to "authenticated";
grant UPDATE on "public"."erros_app" to "authenticated";
grant DELETE on "public"."erros_app" to "authenticated";
grant TRUNCATE on "public"."erros_app" to "authenticated";
grant REFERENCES on "public"."erros_app" to "authenticated";
grant TRIGGER on "public"."erros_app" to "authenticated";
grant INSERT on "public"."erros_app" to "service_role";
grant SELECT on "public"."erros_app" to "service_role";
grant UPDATE on "public"."erros_app" to "service_role";
grant DELETE on "public"."erros_app" to "service_role";
grant TRUNCATE on "public"."erros_app" to "service_role";
grant REFERENCES on "public"."erros_app" to "service_role";
grant TRIGGER on "public"."erros_app" to "service_role";
grant INSERT on "public"."automacao_log" to "authenticated";
grant SELECT on "public"."automacao_log" to "authenticated";
grant UPDATE on "public"."automacao_log" to "authenticated";
grant DELETE on "public"."automacao_log" to "authenticated";
grant TRUNCATE on "public"."automacao_log" to "authenticated";
grant REFERENCES on "public"."automacao_log" to "authenticated";
grant TRIGGER on "public"."automacao_log" to "authenticated";
grant INSERT on "public"."automacao_log" to "service_role";
grant SELECT on "public"."automacao_log" to "service_role";
grant UPDATE on "public"."automacao_log" to "service_role";
grant DELETE on "public"."automacao_log" to "service_role";
grant TRUNCATE on "public"."automacao_log" to "service_role";
grant REFERENCES on "public"."automacao_log" to "service_role";
grant TRIGGER on "public"."automacao_log" to "service_role";
grant INSERT on "public"."opcoes_grade" to "authenticated";
grant SELECT on "public"."opcoes_grade" to "authenticated";
grant UPDATE on "public"."opcoes_grade" to "authenticated";
grant DELETE on "public"."opcoes_grade" to "authenticated";
grant TRUNCATE on "public"."opcoes_grade" to "authenticated";
grant REFERENCES on "public"."opcoes_grade" to "authenticated";
grant TRIGGER on "public"."opcoes_grade" to "authenticated";
grant INSERT on "public"."opcoes_grade" to "service_role";
grant SELECT on "public"."opcoes_grade" to "service_role";
grant UPDATE on "public"."opcoes_grade" to "service_role";
grant DELETE on "public"."opcoes_grade" to "service_role";
grant TRUNCATE on "public"."opcoes_grade" to "service_role";
grant REFERENCES on "public"."opcoes_grade" to "service_role";
grant TRIGGER on "public"."opcoes_grade" to "service_role";
grant INSERT on "public"."panorama_fotos" to "authenticated";
grant SELECT on "public"."panorama_fotos" to "authenticated";
grant UPDATE on "public"."panorama_fotos" to "authenticated";
grant DELETE on "public"."panorama_fotos" to "authenticated";
grant TRUNCATE on "public"."panorama_fotos" to "authenticated";
grant REFERENCES on "public"."panorama_fotos" to "authenticated";
grant TRIGGER on "public"."panorama_fotos" to "authenticated";
grant INSERT on "public"."panorama_fotos" to "service_role";
grant SELECT on "public"."panorama_fotos" to "service_role";
grant UPDATE on "public"."panorama_fotos" to "service_role";
grant DELETE on "public"."panorama_fotos" to "service_role";
grant TRUNCATE on "public"."panorama_fotos" to "service_role";
grant REFERENCES on "public"."panorama_fotos" to "service_role";
grant TRIGGER on "public"."panorama_fotos" to "service_role";
grant INSERT on "public"."aulas_teste_txt" to "authenticated";
grant SELECT on "public"."aulas_teste_txt" to "authenticated";
grant UPDATE on "public"."aulas_teste_txt" to "authenticated";
grant DELETE on "public"."aulas_teste_txt" to "authenticated";
grant TRUNCATE on "public"."aulas_teste_txt" to "authenticated";
grant REFERENCES on "public"."aulas_teste_txt" to "authenticated";
grant TRIGGER on "public"."aulas_teste_txt" to "authenticated";
grant INSERT on "public"."aulas_teste_txt" to "service_role";
grant SELECT on "public"."aulas_teste_txt" to "service_role";
grant UPDATE on "public"."aulas_teste_txt" to "service_role";
grant DELETE on "public"."aulas_teste_txt" to "service_role";
grant TRUNCATE on "public"."aulas_teste_txt" to "service_role";
grant REFERENCES on "public"."aulas_teste_txt" to "service_role";
grant TRIGGER on "public"."aulas_teste_txt" to "service_role";
grant INSERT on "public"."mercado_cache" to "service_role";
grant SELECT on "public"."mercado_cache" to "service_role";
grant UPDATE on "public"."mercado_cache" to "service_role";
grant DELETE on "public"."mercado_cache" to "service_role";
grant TRUNCATE on "public"."mercado_cache" to "service_role";
grant REFERENCES on "public"."mercado_cache" to "service_role";
grant TRIGGER on "public"."mercado_cache" to "service_role";
grant SELECT on "public"."mercado_cache" to "authenticated";
grant INSERT on "public"."analise_uso" to "service_role";
grant SELECT on "public"."analise_uso" to "service_role";
grant UPDATE on "public"."analise_uso" to "service_role";
grant DELETE on "public"."analise_uso" to "service_role";
grant TRUNCATE on "public"."analise_uso" to "service_role";
grant REFERENCES on "public"."analise_uso" to "service_role";
grant TRIGGER on "public"."analise_uso" to "service_role";
grant INSERT on "public"."aulas_teste" to "authenticated";
grant SELECT on "public"."aulas_teste" to "authenticated";
grant UPDATE on "public"."aulas_teste" to "authenticated";
grant DELETE on "public"."aulas_teste" to "authenticated";
grant TRUNCATE on "public"."aulas_teste" to "authenticated";
grant REFERENCES on "public"."aulas_teste" to "authenticated";
grant TRIGGER on "public"."aulas_teste" to "authenticated";
grant INSERT on "public"."aulas_teste" to "service_role";
grant SELECT on "public"."aulas_teste" to "service_role";
grant UPDATE on "public"."aulas_teste" to "service_role";
grant DELETE on "public"."aulas_teste" to "service_role";
grant TRUNCATE on "public"."aulas_teste" to "service_role";
grant REFERENCES on "public"."aulas_teste" to "service_role";
grant TRIGGER on "public"."aulas_teste" to "service_role";
grant INSERT on "public"."aulas_audio_jobs" to "service_role";
grant SELECT on "public"."aulas_audio_jobs" to "service_role";
grant UPDATE on "public"."aulas_audio_jobs" to "service_role";
grant DELETE on "public"."aulas_audio_jobs" to "service_role";
grant TRUNCATE on "public"."aulas_audio_jobs" to "service_role";
grant REFERENCES on "public"."aulas_audio_jobs" to "service_role";
grant TRIGGER on "public"."aulas_audio_jobs" to "service_role";
grant INSERT on "public"."aulas_imagens_jobs" to "service_role";
grant SELECT on "public"."aulas_imagens_jobs" to "service_role";
grant UPDATE on "public"."aulas_imagens_jobs" to "service_role";
grant DELETE on "public"."aulas_imagens_jobs" to "service_role";
grant INSERT on "public"."aulas_fila" to "authenticated";
grant SELECT on "public"."aulas_fila" to "authenticated";
grant UPDATE on "public"."aulas_fila" to "authenticated";
grant DELETE on "public"."aulas_fila" to "authenticated";
grant TRUNCATE on "public"."aulas_fila" to "authenticated";
grant REFERENCES on "public"."aulas_fila" to "authenticated";
grant TRIGGER on "public"."aulas_fila" to "authenticated";
grant INSERT on "public"."aulas_fila" to "service_role";
grant SELECT on "public"."aulas_fila" to "service_role";
grant UPDATE on "public"."aulas_fila" to "service_role";
grant DELETE on "public"."aulas_fila" to "service_role";
grant TRUNCATE on "public"."aulas_fila" to "service_role";
grant REFERENCES on "public"."aulas_fila" to "service_role";
grant TRIGGER on "public"."aulas_fila" to "service_role";
grant INSERT on "public"."profit_prints" to "authenticated";
grant SELECT on "public"."profit_prints" to "authenticated";
grant UPDATE on "public"."profit_prints" to "authenticated";
grant DELETE on "public"."profit_prints" to "authenticated";
grant TRUNCATE on "public"."profit_prints" to "authenticated";
grant REFERENCES on "public"."profit_prints" to "authenticated";
grant TRIGGER on "public"."profit_prints" to "authenticated";
grant INSERT on "public"."profit_prints" to "service_role";
grant SELECT on "public"."profit_prints" to "service_role";
grant UPDATE on "public"."profit_prints" to "service_role";
grant DELETE on "public"."profit_prints" to "service_role";
grant TRUNCATE on "public"."profit_prints" to "service_role";
grant REFERENCES on "public"."profit_prints" to "service_role";
grant TRIGGER on "public"."profit_prints" to "service_role";
grant INSERT on "public"."movimentos" to "authenticated";
grant SELECT on "public"."movimentos" to "authenticated";
grant UPDATE on "public"."movimentos" to "authenticated";
grant DELETE on "public"."movimentos" to "authenticated";
grant TRUNCATE on "public"."movimentos" to "authenticated";
grant REFERENCES on "public"."movimentos" to "authenticated";
grant TRIGGER on "public"."movimentos" to "authenticated";
grant INSERT on "public"."movimentos" to "service_role";
grant SELECT on "public"."movimentos" to "service_role";
grant UPDATE on "public"."movimentos" to "service_role";
grant DELETE on "public"."movimentos" to "service_role";
grant TRUNCATE on "public"."movimentos" to "service_role";
grant REFERENCES on "public"."movimentos" to "service_role";
grant TRIGGER on "public"."movimentos" to "service_role";
grant INSERT on "public"."insiders" to "authenticated";
grant SELECT on "public"."insiders" to "authenticated";
grant UPDATE on "public"."insiders" to "authenticated";
grant DELETE on "public"."insiders" to "authenticated";
grant TRUNCATE on "public"."insiders" to "authenticated";
grant REFERENCES on "public"."insiders" to "authenticated";
grant TRIGGER on "public"."insiders" to "authenticated";
grant INSERT on "public"."insiders" to "service_role";
grant SELECT on "public"."insiders" to "service_role";
grant UPDATE on "public"."insiders" to "service_role";
grant DELETE on "public"."insiders" to "service_role";
grant TRUNCATE on "public"."insiders" to "service_role";
grant REFERENCES on "public"."insiders" to "service_role";
grant TRIGGER on "public"."insiders" to "service_role";
grant INSERT on "public"."fluxo_acoes" to "authenticated";
grant SELECT on "public"."fluxo_acoes" to "authenticated";
grant UPDATE on "public"."fluxo_acoes" to "authenticated";
grant DELETE on "public"."fluxo_acoes" to "authenticated";
grant TRUNCATE on "public"."fluxo_acoes" to "authenticated";
grant REFERENCES on "public"."fluxo_acoes" to "authenticated";
grant TRIGGER on "public"."fluxo_acoes" to "authenticated";
grant INSERT on "public"."fluxo_acoes" to "service_role";
grant SELECT on "public"."fluxo_acoes" to "service_role";
grant UPDATE on "public"."fluxo_acoes" to "service_role";
grant DELETE on "public"."fluxo_acoes" to "service_role";
grant TRUNCATE on "public"."fluxo_acoes" to "service_role";
grant REFERENCES on "public"."fluxo_acoes" to "service_role";
grant TRIGGER on "public"."fluxo_acoes" to "service_role";
grant INSERT on "public"."push_log" to "service_role";
grant SELECT on "public"."push_log" to "service_role";
grant UPDATE on "public"."push_log" to "service_role";
grant DELETE on "public"."push_log" to "service_role";
grant TRUNCATE on "public"."push_log" to "service_role";
grant REFERENCES on "public"."push_log" to "service_role";
grant TRIGGER on "public"."push_log" to "service_role";
revoke all on function "public"."rls_auto_enable"() from public,anon,authenticated;
grant execute on function "public"."rls_auto_enable"() to "postgres";
grant execute on function "public"."rls_auto_enable"() to "service_role";
revoke all on function "public"."analise_reservar_uso"(p_uid uuid, p_dia date, p_modo text, p_limite integer) from public,anon,authenticated;
grant execute on function "public"."analise_reservar_uso"(p_uid uuid, p_dia date, p_modo text, p_limite integer) to "postgres";
grant execute on function "public"."analise_reservar_uso"(p_uid uuid, p_dia date, p_modo text, p_limite integer) to "service_role";
revoke all on function "public"."erros_app_limpa"() from public,anon,authenticated;
grant execute on function "public"."erros_app_limpa"() to "postgres";
grant execute on function "public"."erros_app_limpa"() to "service_role";
revoke all on function "public"."diario_salvar_cas"(expected_data jsonb, new_data jsonb) from public,anon,authenticated;
grant execute on function "public"."diario_salvar_cas"(expected_data jsonb, new_data jsonb) to "postgres";
grant execute on function "public"."diario_salvar_cas"(expected_data jsonb, new_data jsonb) to "authenticated";
grant execute on function "public"."diario_salvar_cas"(expected_data jsonb, new_data jsonb) to "service_role";
revoke all on function "app_private"."mercado_tick"() from public,anon,authenticated;
grant execute on function "app_private"."mercado_tick"() to "postgres";
revoke all on function "public"."aulas_reservar_uso"(p_uid uuid, p_acao text, p_chave text) from public,anon,authenticated;
grant execute on function "public"."aulas_reservar_uso"(p_uid uuid, p_acao text, p_chave text) to "postgres";
grant execute on function "public"."aulas_reservar_uso"(p_uid uuid, p_acao text, p_chave text) to "service_role";
revoke all on function "public"."aulas_finalizar_uso"(p_uid uuid, p_id uuid) from public,anon,authenticated;
grant execute on function "public"."aulas_finalizar_uso"(p_uid uuid, p_id uuid) to "postgres";
grant execute on function "public"."aulas_finalizar_uso"(p_uid uuid, p_id uuid) to "service_role";
revoke all on function "public"."parceiro_ver"(t text) from public,anon,authenticated;
grant execute on function "public"."parceiro_ver"(t text) to "postgres";
grant execute on function "public"."parceiro_ver"(t text) to "authenticated";
grant execute on function "public"."parceiro_ver"(t text) to "service_role";
grant execute on function "public"."parceiro_ver"(t text) to "anon";
revoke all on function "app_private"."fluxo_tick"() from public,anon,authenticated;
grant execute on function "app_private"."fluxo_tick"() to "postgres";
revoke all on function "public"."diario_incrementar_revisao"() from public,anon,authenticated;
grant execute on function "public"."diario_incrementar_revisao"() to "postgres";
grant execute on function "public"."diario_incrementar_revisao"() to "service_role";
revoke all on function "public"."diario_salvar_revisao"(expected_revision bigint, new_data jsonb) from public,anon,authenticated;
grant execute on function "public"."diario_salvar_revisao"(expected_revision bigint, new_data jsonb) to "postgres";
grant execute on function "public"."diario_salvar_revisao"(expected_revision bigint, new_data jsonb) to "authenticated";
grant execute on function "public"."diario_salvar_revisao"(expected_revision bigint, new_data jsonb) to "service_role";
revoke all on function "public"."push_reservar"(p_chave text, p_subscription text, p_payload jsonb) from public,anon,authenticated;
grant execute on function "public"."push_reservar"(p_chave text, p_subscription text, p_payload jsonb) to "postgres";
grant execute on function "public"."push_reservar"(p_chave text, p_subscription text, p_payload jsonb) to "service_role";
revoke all on function "public"."push_concluir"(p_chave text, p_lease uuid, p_ok boolean, p_erro text, p_invalida boolean) from public,anon,authenticated;
grant execute on function "public"."push_concluir"(p_chave text, p_lease uuid, p_ok boolean, p_erro text, p_invalida boolean) to "postgres";
grant execute on function "public"."push_concluir"(p_chave text, p_lease uuid, p_ok boolean, p_erro text, p_invalida boolean) to "service_role";
revoke all on function "public"."push_retentar_lote"(p_limit integer) from public,anon,authenticated;
grant execute on function "public"."push_retentar_lote"(p_limit integer) to "postgres";
grant execute on function "public"."push_retentar_lote"(p_limit integer) to "service_role";
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('fotos','fotos',false,10485760,array['image/jpeg','image/png','image/webp','image/heic']::text[]) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('livros','livros',false,52428800,array['application/pdf']::text[]) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('aulas-visuais','aulas-visuais',false,5242880,array['image/png','image/jpeg','image/webp']::text[]) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('aulas-audio','aulas-audio',false,20971520,array['audio/wav']::text[]) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('aulas-videos','aulas-videos',false,52428800,array['video/mp4']::text[]) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('aulas-figuras','aulas-figuras',false,2097152,array['image/jpeg','image/png','image/webp']::text[]) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('backups','backups',false,52428800,array['application/json']::text[]) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('planilhas','planilhas',false,30000000,array['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']::text[]) on conflict(id) do nothing;
select cron.schedule('fluxo-acoes-limpa','55 3 * * *',' delete from public.fluxo_acoes where dia < current_date - 30 ');
select cron.alter_job((select jobid from cron.job where jobname='fluxo-acoes-limpa'),active:=false);
select cron.schedule('insiders','0 11 * * *',' select net.http_post(url := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/insiders'', headers := ''{"Content-Type":"application/json"}''::jsonb, body := ''{}''::jsonb, timeout_milliseconds := 120000) ');
select cron.alter_job((select jobid from cron.job where jobname='insiders'),active:=false);
select cron.schedule('jornal-mesa','*/10 9-23 * * *',' select net.http_post(
  url := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/mesa'',
  headers := (select (regexp_match(command, ''headers\s*:=\s*''''([^'''']+)''''''))[1]::jsonb from cron.job where jobname=''radar-varrer''),
  body := ''{}''::jsonb, timeout_milliseconds := 150000) ');
select cron.alter_job((select jobid from cron.job where jobname='jornal-mesa'),active:=false);
select cron.schedule('notificar-tick','* * * * *',' select net.http_post(
       url     := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/notificar'',
       headers := ''{"Content-Type":"application/json","x-cron-secret":"__CONFIGURAR_NO_VAULT__"}''::jsonb,
       body    := ''{"acao":"tick"}''::jsonb
     ); ');
select cron.alter_job((select jobid from cron.job where jobname='notificar-tick'),active:=false);
select cron.schedule('push-log-limpa','0 3 * * *',' delete from public.push_log where em < now() - interval ''3 days''; ');
select cron.alter_job((select jobid from cron.job where jobname='push-log-limpa'),active:=false);
select cron.schedule('resumo-tick','* * * * *',' select net.http_post(
       url     := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/resumo'',
       headers := ''{"Content-Type":"application/json","x-cron-secret":"__CONFIGURAR_NO_VAULT__"}''::jsonb,
       body    := ''{"acao":"tick"}''::jsonb
     ); ');
select cron.alter_job((select jobid from cron.job where jobname='resumo-tick'),active:=false);
select cron.schedule('radar-varrer','*/15 13-20 * * 1-5',' select net.http_post(
       url     := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/radar'',
       headers := ''{"Content-Type":"application/json","x-cron-secret":"__CONFIGURAR_NO_VAULT__"}''::jsonb,
       body    := ''{"acao":"varrer"}''::jsonb,
       timeout_milliseconds := 120000
     ); ');
select cron.alter_job((select jobid from cron.job where jobname='radar-varrer'),active:=false);
select cron.schedule('radar-limpa','30 3 * * *',' delete from public.radar_sinais where dia < current_date - 30; ');
select cron.alter_job((select jobid from cron.job where jobname='radar-limpa'),active:=false);
select cron.schedule('radar-cripto','7,37 * * * *',' select net.http_post(
       url     := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/radar'',
       headers := ''{"Content-Type":"application/json","x-cron-secret":"__CONFIGURAR_NO_VAULT__"}''::jsonb,
       body    := ''{"acao":"cripto"}''::jsonb,
       timeout_milliseconds := 120000
     ); ');
select cron.alter_job((select jobid from cron.job where jobname='radar-cripto'),active:=false);
select cron.schedule('mercado-cache-minuto','* * * * *','select app_private.mercado_tick()');
select cron.alter_job((select jobid from cron.job where jobname='mercado-cache-minuto'),active:=false);
select cron.schedule('aulas-fila','* * * * *',' select net.http_post(
  url := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/aulas'',
  headers := ''{"Content-Type":"application/json"}''::jsonb,
  body := ''{"acao":"processar"}''::jsonb, timeout_milliseconds := 5000) ');
select cron.alter_job((select jobid from cron.job where jobname='aulas-fila'),active:=false);
select cron.schedule('aulas-fila-limpa','40 3 * * *',' delete from public.aulas_fila where status in (''feito'',''erro'') and atualizado < now() - interval ''7 days''; delete from public.profit_prints where criado < now() - interval ''30 days''; ');
select cron.alter_job((select jobid from cron.job where jobname='aulas-fila-limpa'),active:=false);
select cron.schedule('email-semana','0 0 * * 1',' select net.http_post(url := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/email-semana'', headers := ''{"Content-Type":"application/json"}''::jsonb, body := ''{}''::jsonb, timeout_milliseconds := 30000) ');
select cron.alter_job((select jobid from cron.job where jobname='email-semana'),active:=false);
select cron.schedule('movimentos','*/5 * * * *',' select net.http_post(url := ''https://wbpsmszecpzioaijfnsl.supabase.co/functions/v1/movimentos'', headers := ''{"Content-Type":"application/json"}''::jsonb, body := ''{}''::jsonb, timeout_milliseconds := 60000) ');
select cron.alter_job((select jobid from cron.job where jobname='movimentos'),active:=false);
select cron.schedule('movimentos-limpa','50 3 * * *',' delete from public.movimentos where dia < current_date - 60 ');
select cron.alter_job((select jobid from cron.job where jobname='movimentos-limpa'),active:=false);
select cron.schedule('fluxo-b3','*/20 10-23 * * *','select app_private.fluxo_tick()');
select cron.alter_job((select jobid from cron.job where jobname='fluxo-b3'),active:=false);
-- Ownership e permissões das sequências que os INSERTs autenticados utilizam.
alter sequence "public"."ewz_serie_id_seq" owned by "public"."ewz_serie"."id";
alter sequence "public"."ewz_boletas_id_seq" owned by "public"."ewz_boletas"."id";
alter sequence "public"."operacoes_profit_id_seq" owned by "public"."operacoes_profit"."id";
alter sequence "public"."carteira_relatorios_id_seq" owned by "public"."carteira_relatorios"."id";
alter sequence "public"."erros_app_id_seq" owned by "public"."erros_app"."id";
alter sequence "public"."panorama_fotos_id_seq" owned by "public"."panorama_fotos"."id";
alter sequence "public"."automacao_log_id_seq" owned by "public"."automacao_log"."id";
alter sequence "public"."analise_uso_id_seq" owned by "public"."analise_uso"."id";
alter sequence "public"."profit_prints_id_seq" owned by "public"."profit_prints"."id";
alter sequence "public"."movimentos_id_seq" owned by "public"."movimentos"."id";
alter sequence "public"."aulas_fila_id_seq" owned by "public"."aulas_fila"."id";
alter sequence "public"."insiders_id_seq" owned by "public"."insiders"."id";
grant SELECT on sequence "public"."ewz_serie_id_seq" to "postgres";
grant UPDATE on sequence "public"."ewz_serie_id_seq" to "postgres";
grant USAGE on sequence "public"."ewz_serie_id_seq" to "postgres";
grant SELECT on sequence "public"."ewz_serie_id_seq" to "authenticated";
grant UPDATE on sequence "public"."ewz_serie_id_seq" to "authenticated";
grant USAGE on sequence "public"."ewz_serie_id_seq" to "authenticated";
grant SELECT on sequence "public"."ewz_serie_id_seq" to "service_role";
grant UPDATE on sequence "public"."ewz_serie_id_seq" to "service_role";
grant USAGE on sequence "public"."ewz_serie_id_seq" to "service_role";
grant SELECT on sequence "public"."ewz_boletas_id_seq" to "postgres";
grant UPDATE on sequence "public"."ewz_boletas_id_seq" to "postgres";
grant USAGE on sequence "public"."ewz_boletas_id_seq" to "postgres";
grant SELECT on sequence "public"."ewz_boletas_id_seq" to "authenticated";
grant UPDATE on sequence "public"."ewz_boletas_id_seq" to "authenticated";
grant USAGE on sequence "public"."ewz_boletas_id_seq" to "authenticated";
grant SELECT on sequence "public"."ewz_boletas_id_seq" to "service_role";
grant UPDATE on sequence "public"."ewz_boletas_id_seq" to "service_role";
grant USAGE on sequence "public"."ewz_boletas_id_seq" to "service_role";
grant SELECT on sequence "public"."operacoes_profit_id_seq" to "postgres";
grant UPDATE on sequence "public"."operacoes_profit_id_seq" to "postgres";
grant USAGE on sequence "public"."operacoes_profit_id_seq" to "postgres";
grant SELECT on sequence "public"."operacoes_profit_id_seq" to "authenticated";
grant UPDATE on sequence "public"."operacoes_profit_id_seq" to "authenticated";
grant USAGE on sequence "public"."operacoes_profit_id_seq" to "authenticated";
grant SELECT on sequence "public"."operacoes_profit_id_seq" to "service_role";
grant UPDATE on sequence "public"."operacoes_profit_id_seq" to "service_role";
grant USAGE on sequence "public"."operacoes_profit_id_seq" to "service_role";
grant SELECT on sequence "public"."carteira_relatorios_id_seq" to "postgres";
grant UPDATE on sequence "public"."carteira_relatorios_id_seq" to "postgres";
grant USAGE on sequence "public"."carteira_relatorios_id_seq" to "postgres";
grant SELECT on sequence "public"."carteira_relatorios_id_seq" to "authenticated";
grant UPDATE on sequence "public"."carteira_relatorios_id_seq" to "authenticated";
grant USAGE on sequence "public"."carteira_relatorios_id_seq" to "authenticated";
grant SELECT on sequence "public"."carteira_relatorios_id_seq" to "service_role";
grant UPDATE on sequence "public"."carteira_relatorios_id_seq" to "service_role";
grant USAGE on sequence "public"."carteira_relatorios_id_seq" to "service_role";
grant SELECT on sequence "public"."erros_app_id_seq" to "postgres";
grant UPDATE on sequence "public"."erros_app_id_seq" to "postgres";
grant USAGE on sequence "public"."erros_app_id_seq" to "postgres";
grant SELECT on sequence "public"."erros_app_id_seq" to "authenticated";
grant UPDATE on sequence "public"."erros_app_id_seq" to "authenticated";
grant USAGE on sequence "public"."erros_app_id_seq" to "authenticated";
grant SELECT on sequence "public"."erros_app_id_seq" to "service_role";
grant UPDATE on sequence "public"."erros_app_id_seq" to "service_role";
grant USAGE on sequence "public"."erros_app_id_seq" to "service_role";
grant SELECT on sequence "public"."panorama_fotos_id_seq" to "postgres";
grant UPDATE on sequence "public"."panorama_fotos_id_seq" to "postgres";
grant USAGE on sequence "public"."panorama_fotos_id_seq" to "postgres";
grant SELECT on sequence "public"."panorama_fotos_id_seq" to "authenticated";
grant UPDATE on sequence "public"."panorama_fotos_id_seq" to "authenticated";
grant USAGE on sequence "public"."panorama_fotos_id_seq" to "authenticated";
grant SELECT on sequence "public"."panorama_fotos_id_seq" to "service_role";
grant UPDATE on sequence "public"."panorama_fotos_id_seq" to "service_role";
grant USAGE on sequence "public"."panorama_fotos_id_seq" to "service_role";
grant SELECT on sequence "public"."automacao_log_id_seq" to "postgres";
grant UPDATE on sequence "public"."automacao_log_id_seq" to "postgres";
grant USAGE on sequence "public"."automacao_log_id_seq" to "postgres";
grant SELECT on sequence "public"."automacao_log_id_seq" to "authenticated";
grant UPDATE on sequence "public"."automacao_log_id_seq" to "authenticated";
grant USAGE on sequence "public"."automacao_log_id_seq" to "authenticated";
grant SELECT on sequence "public"."automacao_log_id_seq" to "service_role";
grant UPDATE on sequence "public"."automacao_log_id_seq" to "service_role";
grant USAGE on sequence "public"."automacao_log_id_seq" to "service_role";
grant SELECT on sequence "public"."analise_uso_id_seq" to "postgres";
grant UPDATE on sequence "public"."analise_uso_id_seq" to "postgres";
grant USAGE on sequence "public"."analise_uso_id_seq" to "postgres";
grant SELECT on sequence "public"."analise_uso_id_seq" to "authenticated";
grant UPDATE on sequence "public"."analise_uso_id_seq" to "authenticated";
grant USAGE on sequence "public"."analise_uso_id_seq" to "authenticated";
grant SELECT on sequence "public"."analise_uso_id_seq" to "service_role";
grant UPDATE on sequence "public"."analise_uso_id_seq" to "service_role";
grant USAGE on sequence "public"."analise_uso_id_seq" to "service_role";
grant SELECT on sequence "public"."profit_prints_id_seq" to "postgres";
grant UPDATE on sequence "public"."profit_prints_id_seq" to "postgres";
grant USAGE on sequence "public"."profit_prints_id_seq" to "postgres";
grant SELECT on sequence "public"."profit_prints_id_seq" to "authenticated";
grant UPDATE on sequence "public"."profit_prints_id_seq" to "authenticated";
grant USAGE on sequence "public"."profit_prints_id_seq" to "authenticated";
grant SELECT on sequence "public"."profit_prints_id_seq" to "service_role";
grant UPDATE on sequence "public"."profit_prints_id_seq" to "service_role";
grant USAGE on sequence "public"."profit_prints_id_seq" to "service_role";
grant SELECT on sequence "public"."movimentos_id_seq" to "postgres";
grant UPDATE on sequence "public"."movimentos_id_seq" to "postgres";
grant USAGE on sequence "public"."movimentos_id_seq" to "postgres";
grant SELECT on sequence "public"."movimentos_id_seq" to "authenticated";
grant UPDATE on sequence "public"."movimentos_id_seq" to "authenticated";
grant USAGE on sequence "public"."movimentos_id_seq" to "authenticated";
grant SELECT on sequence "public"."movimentos_id_seq" to "service_role";
grant UPDATE on sequence "public"."movimentos_id_seq" to "service_role";
grant USAGE on sequence "public"."movimentos_id_seq" to "service_role";
grant SELECT on sequence "public"."aulas_fila_id_seq" to "postgres";
grant UPDATE on sequence "public"."aulas_fila_id_seq" to "postgres";
grant USAGE on sequence "public"."aulas_fila_id_seq" to "postgres";
grant SELECT on sequence "public"."aulas_fila_id_seq" to "authenticated";
grant UPDATE on sequence "public"."aulas_fila_id_seq" to "authenticated";
grant USAGE on sequence "public"."aulas_fila_id_seq" to "authenticated";
grant SELECT on sequence "public"."aulas_fila_id_seq" to "service_role";
grant UPDATE on sequence "public"."aulas_fila_id_seq" to "service_role";
grant USAGE on sequence "public"."aulas_fila_id_seq" to "service_role";
grant SELECT on sequence "public"."insiders_id_seq" to "postgres";
grant UPDATE on sequence "public"."insiders_id_seq" to "postgres";
grant USAGE on sequence "public"."insiders_id_seq" to "postgres";
grant SELECT on sequence "public"."insiders_id_seq" to "authenticated";
grant UPDATE on sequence "public"."insiders_id_seq" to "authenticated";
grant USAGE on sequence "public"."insiders_id_seq" to "authenticated";
grant SELECT on sequence "public"."insiders_id_seq" to "service_role";
grant UPDATE on sequence "public"."insiders_id_seq" to "service_role";
grant USAGE on sequence "public"."insiders_id_seq" to "service_role";
