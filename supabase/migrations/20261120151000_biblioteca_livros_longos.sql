alter table public.conhecimento_trading
 drop constraint conhecimento_trading_chunk_index_check,
 add constraint conhecimento_trading_chunk_index_check check (chunk_index >= 0 and chunk_index < 12000);
