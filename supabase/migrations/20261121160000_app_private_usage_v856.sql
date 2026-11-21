-- v856: a função aulas_reservar_uso (SECURITY INVOKER) roda como service_role e grava em app_private.aulas_consumo.
-- O baseline concedeu as tabelas mas não o uso do schema. Aditivo: só service_role; anon/authenticated continuam sem acesso.
grant usage on schema app_private to service_role;
