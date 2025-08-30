--
-- PostgreSQL database dump
--

\restrict r9azn3QMC3OACtzJAtGox8fG1mZqATQY6wFvFmXGiV1Hv0PwNgZMchWaPrERem2

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


--
-- Name: auto_create_individual_participant(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_create_individual_participant() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    pedido_record RECORD;
    user_record RECORD;
BEGIN
    -- Busca informações do pedido
    SELECT p.*, u.nome, u.email, u.tipo, u.cidade, u.igreja
    INTO pedido_record
    FROM pedidos p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = NEW.pedido_id;
    
    -- Se o pedido é individual (feito por jovem), cria participante automaticamente
    IF pedido_record.tipo_pedido = 'individual' THEN
        INSERT INTO participantes (
            item_pedido_id,
            user_id,
            nome,
            tamanho,
            cidade,
            igreja
        )
        VALUES (
            NEW.id,
            pedido_record.user_id,
            pedido_record.nome, -- Nome do próprio jovem que fez o pedido
            NEW.tamanho,
            pedido_record.cidade,
            pedido_record.igreja
        );
        
        -- Log para debug
        RAISE NOTICE 'Participante criado automaticamente para pedido individual: user_id=%, nome=%, tamanho=%', 
            pedido_record.user_id, pedido_record.nome, NEW.tamanho;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: FUNCTION auto_create_individual_participant(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.auto_create_individual_participant() IS 'Função que automaticamente cria um registro de participante quando um jovem faz um pedido individual';


--
-- Name: create_group_order(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_group_order(data jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  new_pedido_id uuid;
  new_item_id uuid;
  item record;
  participante record;
  -- Variáveis para buscar cidade e igreja do líder
  leader_cidade text;
  leader_igreja text;
begin
  -- PASSO 1: Inserir na tabela 'pedidos'
  insert into public.pedidos (user_id, tipo_pedido, valor_total, status)
  values (
    auth.uid(), -- Pega o ID do líder logado
    data->>'tipo_pedido',
    (data->>'valor_total')::numeric,
    'pendente'
  ) returning id into new_pedido_id; -- Salva o ID do novo pedido na variável

  -- Busca a cidade e igreja do líder para usar nos participantes
  select cidade, igreja into leader_cidade, leader_igreja
  from public.users
  where id = auth.uid();

  -- PASSO 2: Inserir os itens do pedido
  for item in select * from jsonb_to_recordset(data->'itens') as x(tamanho text, quantidade int, preco_unitario numeric)
  loop
      insert into public.itens_pedido (pedido_id, tamanho, quantidade, preco_unitario)
      values (new_pedido_id, item.tamanho, item.quantidade, item.preco_unitario)
      returning id into new_item_id;
      
      -- PASSO 3: Inserir participantes para este item específico
      for participante in select * from jsonb_to_recordset(data->'participantes') as p(nome text, tamanho text)
      loop
        -- Verifica se o participante pertence a este item (pelo tamanho)
        if participante.tamanho = item.tamanho then
          insert into public.participantes (
            item_pedido_id, -- Referência ao item específico
            user_id,        -- ID do líder que fez o pedido
            nome,
            tamanho,
            cidade,         -- Usa a cidade do líder
            igreja          -- Usa a igreja do líder
          )
          values (
            new_item_id,
            auth.uid(),
            participante.nome,
            participante.tamanho,
            leader_cidade,
            leader_igreja
          );
        end if;
      end loop;
  end loop;

  return new_pedido_id;
end;
$$;


--
-- Name: FUNCTION create_group_order(data jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.create_group_order(data jsonb) IS 'Função para criar pedidos em grupo de forma transacional, inserindo pedido, itens e participantes';


--
-- Name: get_umadepar_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_umadepar_stats() RETURNS TABLE(total_usuarios integer, total_jovens integer, total_lideres integer, total_pedidos integer, total_pedidos_pagos integer, total_pedidos_pendentes integer, total_participantes integer, total_arrecadado numeric, camisetas_vendidas integer, cidades_participantes integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM users WHERE tipo != 'admin'),
        (SELECT COUNT(*)::INTEGER FROM users WHERE tipo = 'jovem'),
        (SELECT COUNT(*)::INTEGER FROM users WHERE tipo = 'lider'),
        (SELECT COUNT(*)::INTEGER FROM pedidos),
        (SELECT COUNT(*)::INTEGER FROM pedidos WHERE status = 'pago'),
        (SELECT COUNT(*)::INTEGER FROM pedidos WHERE status = 'pendente'),
        (SELECT COUNT(*)::INTEGER FROM participantes),
        (SELECT COALESCE(SUM(valor_total), 0) FROM pedidos WHERE status = 'pago'),
        (SELECT COALESCE(SUM(quantidade), 0)::INTEGER FROM itens_pedido ip JOIN pedidos p ON ip.pedido_id = p.id WHERE p.status = 'pago'),
        (SELECT COUNT(DISTINCT cidade)::INTEGER FROM participantes WHERE cidade IS NOT NULL);
END;
$$;


--
-- Name: FUNCTION get_umadepar_stats(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_umadepar_stats() IS 'Retorna estatísticas gerais do evento UMADEPAR 2025';


--
-- Name: get_vendas_por_cidade(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_vendas_por_cidade() RETURNS TABLE(cidade character varying, participantes integer, receita_total numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(part.cidade, 'Não informado') as cidade,
        COUNT(part.id)::INTEGER as participantes,
        SUM(ip.preco_unitario) as receita_total
    FROM participantes part
    JOIN itens_pedido ip ON part.item_pedido_id = ip.id
    JOIN pedidos p ON ip.pedido_id = p.id
    WHERE p.status = 'pago'
    GROUP BY part.cidade
    ORDER BY participantes DESC;
END;
$$;


--
-- Name: FUNCTION get_vendas_por_cidade(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_vendas_por_cidade() IS 'Retorna relatório de vendas agrupado por cidade dos participantes';


--
-- Name: get_vendas_por_tamanho(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_vendas_por_tamanho() RETURNS TABLE(tamanho character varying, quantidade_vendida integer, receita_total numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ip.tamanho,
        SUM(ip.quantidade)::INTEGER as quantidade_vendida,
        SUM(ip.subtotal) as receita_total
    FROM itens_pedido ip
    JOIN pedidos p ON ip.pedido_id = p.id
    WHERE p.status = 'pago'
    GROUP BY ip.tamanho
    ORDER BY quantidade_vendida DESC;
END;
$$;


--
-- Name: FUNCTION get_vendas_por_tamanho(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_vendas_por_tamanho() IS 'Retorna relatório de vendas agrupado por tamanho de camiseta';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Inserir dados na tabela public.users
  INSERT INTO public.users (
    id,
    email,
    nome,
    tipo,
    telefone,
    endereco,
    cidade,
    igreja,
    lider,
    pastor
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', 'Usuário'),
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'leader' THEN 'lider'
      WHEN new.raw_user_meta_data->>'tipo' = 'lider' THEN 'lider'
      ELSE 'jovem'
    END,
    new.raw_user_meta_data->>'telefone',
    new.raw_user_meta_data->>'endereco',
    new.raw_user_meta_data->>'cidade',
    new.raw_user_meta_data->>'igreja',
    new.raw_user_meta_data->>'lider',
    new.raw_user_meta_data->>'pastor'
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Atualizar o display_name na tabela auth.users
  UPDATE auth.users 
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'display_name', COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', 'Usuário'),
        'phone', new.raw_user_meta_data->>'telefone'
      )
  WHERE id = new.id;
  
  RETURN new;
END;
$$;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND tipo = 'admin'
  );
$$;


--
-- Name: update_pedido_total(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pedido_total() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    pedido_uuid UUID;
    novo_total DECIMAL(10,2);
BEGIN
    -- Determinar o pedido_id baseado na operação
    IF TG_OP = 'DELETE' THEN
        pedido_uuid := OLD.pedido_id;
    ELSE
        pedido_uuid := NEW.pedido_id;
    END IF;
    
    -- Calcular novo total
    SELECT COALESCE(SUM(subtotal), 0) INTO novo_total
    FROM itens_pedido 
    WHERE pedido_id = pedido_uuid;
    
    -- Atualizar valor total do pedido
    UPDATE pedidos 
    SET valor_total = novo_total,
        updated_at = NOW()
    WHERE id = pedido_uuid;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: validate_participante_tamanho(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_participante_tamanho() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM itens_pedido 
        WHERE id = NEW.item_pedido_id AND tamanho = NEW.tamanho
    ) THEN
        RAISE EXCEPTION 'O tamanho do participante deve corresponder ao tamanho do item do pedido';
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: validate_participantes_quantidade(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_participantes_quantidade() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    max_quantidade INTEGER;
    current_count INTEGER;
BEGIN
    -- Buscar quantidade máxima permitida para este item
    SELECT quantidade INTO max_quantidade
    FROM itens_pedido 
    WHERE id = NEW.item_pedido_id;
    
    -- Contar participantes atuais (excluindo o que está sendo atualizado)
    SELECT COUNT(*) INTO current_count
    FROM participantes 
    WHERE item_pedido_id = NEW.item_pedido_id
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- Validar se não excede a quantidade
    IF current_count >= max_quantidade THEN
        RAISE EXCEPTION 'Número de participantes (%) excede a quantidade do item (%)', 
                       current_count + 1, max_quantidade;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: validate_pedido_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_pedido_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pedidos 
        WHERE id = NEW.pedido_id AND status != 'pendente'
    ) THEN
        RAISE EXCEPTION 'Não é possível modificar itens de pedidos que não estão pendentes';
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
BEGIN
    RETURN query EXECUTE
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name || '/' AS name,
                    NULL::uuid AS id,
                    NULL::timestamptz AS updated_at,
                    NULL::timestamptz AS created_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
                ORDER BY prefixes.name COLLATE "C" LIMIT $3
            )
            UNION ALL
            (SELECT split_part(name, '/', $4) AS key,
                name,
                id,
                updated_at,
                created_at,
                metadata
            FROM storage.objects
            WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
            ORDER BY name COLLATE "C" LIMIT $3)
        ) obj
        ORDER BY name COLLATE "C" LIMIT $3;
        $sql$
        USING prefix, bucket_name, limits, levels, start_after;
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: configuracoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    chave character varying(100) NOT NULL,
    valor text NOT NULL,
    descricao text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE configuracoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.configuracoes IS 'Tabela de configurações do sistema UMADEPAR 2025';


--
-- Name: itens_pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_pedido (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_id uuid NOT NULL,
    tamanho character varying(5) NOT NULL,
    quantidade integer NOT NULL,
    preco_unitario numeric(10,2) DEFAULT 79.90 NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((quantidade)::numeric * preco_unitario)) STORED,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT itens_pedido_preco_unitario_check CHECK ((preco_unitario > (0)::numeric)),
    CONSTRAINT itens_pedido_quantidade_check CHECK ((quantidade > 0)),
    CONSTRAINT itens_pedido_tamanho_check CHECK (((tamanho)::text = ANY ((ARRAY['P'::character varying, 'M'::character varying, 'G'::character varying, 'GG'::character varying, 'XG'::character varying, 'XXG'::character varying, 'E1'::character varying, 'E2'::character varying])::text[])))
);


--
-- Name: TABLE itens_pedido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.itens_pedido IS 'Tabela de itens dos pedidos (camisetas) do UMADEPAR 2025';


--
-- Name: COLUMN itens_pedido.pedido_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.itens_pedido.pedido_id IS 'Referência ao pedido pai';


--
-- Name: COLUMN itens_pedido.tamanho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.itens_pedido.tamanho IS 'Tamanho da camiseta: P, M, G, GG ou XG';


--
-- Name: COLUMN itens_pedido.quantidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.itens_pedido.quantidade IS 'Quantidade de camisetas deste tamanho';


--
-- Name: COLUMN itens_pedido.preco_unitario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.itens_pedido.preco_unitario IS 'Preço unitário da camiseta (padrão R$ 79,90)';


--
-- Name: COLUMN itens_pedido.subtotal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.itens_pedido.subtotal IS 'Subtotal calculado automaticamente (quantidade × preço_unitário)';


--
-- Name: participantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_pedido_id uuid NOT NULL,
    user_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    tamanho character varying(5) NOT NULL,
    telefone character varying(20),
    cidade character varying(100),
    igreja character varying(255),
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT participantes_tamanho_check CHECK (((tamanho)::text = ANY ((ARRAY['P'::character varying, 'M'::character varying, 'G'::character varying, 'GG'::character varying, 'XG'::character varying, 'E1'::character varying, 'E2'::character varying, 'XXG'::character varying])::text[])))
);


--
-- Name: TABLE participantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.participantes IS 'Tabela de participantes/compradores das camisetas do UMADEPAR 2025';


--
-- Name: COLUMN participantes.item_pedido_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participantes.item_pedido_id IS 'Referência ao item do pedido (tamanho específico)';


--
-- Name: COLUMN participantes.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participantes.user_id IS 'Referência ao usuário que fez o pedido (jovem ou líder)';


--
-- Name: COLUMN participantes.nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participantes.nome IS 'Nome completo do participante que receberá a camiseta';


--
-- Name: COLUMN participantes.tamanho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participantes.tamanho IS 'Tamanho da camiseta do participante (deve corresponder ao item do pedido)';


--
-- Name: COLUMN participantes.cidade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participantes.cidade IS 'Cidade do participante';


--
-- Name: COLUMN participantes.igreja; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participantes.igreja IS 'Igreja do participante';


--
-- Name: COLUMN participantes.observacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.participantes.observacoes IS 'Observações adicionais sobre o participante';


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tipo_pedido character varying(20) NOT NULL,
    valor_total numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pendente'::character varying,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    mp_preference_id text,
    mp_payment_id bigint,
    mp_status character varying(50),
    mp_transaction_amount numeric(10,2),
    mp_currency_id character varying(3),
    mp_payment_method_id character varying(50),
    mp_payment_type_id character varying(50),
    mp_date_created timestamp with time zone,
    mp_date_approved timestamp with time zone,
    mp_status_detail character varying(100),
    mp_external_reference character varying(255),
    mp_collector_id bigint,
    mp_operation_type character varying(50),
    mp_installments integer,
    mp_issuer_id character varying(50),
    mp_card_last_four_digits character varying(4),
    mp_card_first_six_digits character varying(6),
    mp_fee_amount numeric(10,2),
    mp_net_amount numeric(10,2),
    CONSTRAINT pedidos_status_check CHECK (((status)::text = ANY ((ARRAY['pendente'::character varying, 'pago'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT pedidos_tipo_pedido_check CHECK (((tipo_pedido)::text = ANY ((ARRAY['individual'::character varying, 'grupo'::character varying])::text[]))),
    CONSTRAINT pedidos_valor_total_check CHECK ((valor_total > (0)::numeric))
);


--
-- Name: TABLE pedidos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pedidos IS 'Tabela de pedidos do sistema UMADEPAR 2025';


--
-- Name: COLUMN pedidos.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.user_id IS 'ID do usuário que fez o pedido';


--
-- Name: COLUMN pedidos.tipo_pedido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.tipo_pedido IS 'Tipo do pedido: individual (jovem) ou grupo (líder)';


--
-- Name: COLUMN pedidos.valor_total; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.valor_total IS 'Valor total do pedido em reais';


--
-- Name: COLUMN pedidos.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.status IS 'Status do pedido: pendente, pago ou cancelado';


--
-- Name: COLUMN pedidos.observacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.observacoes IS 'Observações adicionais sobre o pedido';


--
-- Name: COLUMN pedidos.mp_preference_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_preference_id IS 'ID da preferência de pagamento gerada no Mercado Pago';


--
-- Name: COLUMN pedidos.mp_payment_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_payment_id IS 'ID do pagamento confirmado no Mercado Pago';


--
-- Name: COLUMN pedidos.mp_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_status IS 'Status do pagamento retornado pelo Mercado Pago (approved, rejected, etc.)';


--
-- Name: COLUMN pedidos.mp_transaction_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_transaction_amount IS 'Valor real da transação pago no Mercado Pago';


--
-- Name: COLUMN pedidos.mp_currency_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_currency_id IS 'Moeda utilizada na transação (BRL, USD, etc.)';


--
-- Name: COLUMN pedidos.mp_payment_method_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_payment_method_id IS 'Método de pagamento utilizado (pix, credit_card, debit_card, etc.)';


--
-- Name: COLUMN pedidos.mp_payment_type_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_payment_type_id IS 'Tipo de pagamento (account_money, credit_card, debit_card, etc.)';


--
-- Name: COLUMN pedidos.mp_date_created; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_date_created IS 'Data e hora de criação do pagamento no Mercado Pago';


--
-- Name: COLUMN pedidos.mp_date_approved; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_date_approved IS 'Data e hora de aprovação do pagamento no Mercado Pago';


--
-- Name: COLUMN pedidos.mp_status_detail; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_status_detail IS 'Detalhes específicos do status do pagamento';


--
-- Name: COLUMN pedidos.mp_external_reference; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_external_reference IS 'Referência externa do pagamento (ID do pedido no nosso sistema)';


--
-- Name: COLUMN pedidos.mp_collector_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_collector_id IS 'ID do coletor/vendedor no Mercado Pago';


--
-- Name: COLUMN pedidos.mp_operation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_operation_type IS 'Tipo de operação do pagamento (regular_payment, money_transfer, etc.)';


--
-- Name: COLUMN pedidos.mp_installments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_installments IS 'Número de parcelas do pagamento';


--
-- Name: COLUMN pedidos.mp_issuer_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_issuer_id IS 'ID do banco emissor do cartão';


--
-- Name: COLUMN pedidos.mp_card_last_four_digits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_card_last_four_digits IS 'Últimos 4 dígitos do cartão utilizado';


--
-- Name: COLUMN pedidos.mp_card_first_six_digits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_card_first_six_digits IS 'Primeiros 6 dígitos do cartão (BIN)';


--
-- Name: COLUMN pedidos.mp_fee_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_fee_amount IS 'Taxa cobrada pelo Mercado Pago';


--
-- Name: COLUMN pedidos.mp_net_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.pedidos.mp_net_amount IS 'Valor líquido recebido após taxas';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    tipo character varying(20) DEFAULT 'jovem'::character varying,
    telefone character varying(20),
    endereco text,
    cidade character varying(100),
    igreja character varying(255),
    lider character varying(255),
    pastor character varying(255),
    foto_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['jovem'::character varying, 'lider'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Tabela de usuários do sistema UMADEPAR 2025';


--
-- Name: COLUMN users.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.email IS 'Email único do usuário para autenticação';


--
-- Name: COLUMN users.nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.nome IS 'Nome completo do usuário';


--
-- Name: COLUMN users.tipo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.tipo IS 'Tipo de usuário: jovem, lider ou admin';


--
-- Name: COLUMN users.igreja; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.igreja IS 'Nome da igreja do usuário';


--
-- Name: COLUMN users.lider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.lider IS 'Nome do líder responsável (para jovens)';


--
-- Name: COLUMN users.pastor; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.pastor IS 'Nome do pastor da igreja';


--
-- Name: vw_participantes_completo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_participantes_completo WITH (security_invoker='on') AS
 SELECT p.id,
    p.nome,
    p.tamanho,
    p.telefone,
    p.cidade,
    p.igreja,
    p.observacoes,
    p.created_at,
    u.nome AS comprador_nome,
    u.email AS comprador_email,
    u.tipo AS comprador_tipo,
    ped.id AS pedido_id,
    ped.status AS pedido_status,
    ped.valor_total AS pedido_valor,
    ip.quantidade AS item_quantidade,
    ip.preco_unitario AS item_preco,
        CASE
            WHEN (((ped.status)::text = 'pago'::text) AND (ped.mp_payment_id IS NOT NULL)) THEN round((ped.valor_total / (NULLIF(( SELECT sum(ip2.quantidade) AS sum
               FROM public.itens_pedido ip2
              WHERE (ip2.pedido_id = ped.id)), 0))::numeric), 2)
            ELSE ip.preco_unitario
        END AS valor_real_pago
   FROM (((public.participantes p
     JOIN public.users u ON ((p.user_id = u.id)))
     JOIN public.itens_pedido ip ON ((p.item_pedido_id = ip.id)))
     JOIN public.pedidos ped ON ((ip.pedido_id = ped.id)));


--
-- Name: VIEW vw_participantes_completo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_participantes_completo IS 'View com dados completos dos participantes incluindo valor real pago pelo Mercado Pago';


--
-- Name: COLUMN vw_participantes_completo.valor_real_pago; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vw_participantes_completo.valor_real_pago IS 'Valor real pago por item quando o pedido foi aprovado pelo Mercado Pago';


--
-- Name: vw_payment_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_payment_details WITH (security_invoker='on') AS
 SELECT p.id AS pedido_id,
    p.user_id,
    u.nome AS comprador_nome,
    u.email AS comprador_email,
    p.tipo_pedido,
    p.valor_total AS valor_pedido_original,
    p.status AS status_pedido,
    p.created_at AS data_criacao_pedido,
    p.updated_at AS data_atualizacao_pedido,
    p.mp_preference_id,
    p.mp_payment_id,
    p.mp_status,
    p.mp_status_detail,
    p.mp_external_reference,
    p.mp_transaction_amount AS valor_pago_real,
    p.mp_currency_id AS moeda,
    p.mp_fee_amount AS taxa_mp,
    p.mp_net_amount AS valor_liquido_recebido,
    p.mp_payment_method_id AS metodo_pagamento,
    p.mp_payment_type_id AS tipo_pagamento,
    p.mp_installments AS parcelas,
    p.mp_date_created AS data_criacao_pagamento,
    p.mp_date_approved AS data_aprovacao_pagamento,
    p.mp_card_first_six_digits AS bin_cartao,
    p.mp_card_last_four_digits AS final_cartao,
    p.mp_issuer_id AS banco_emissor,
    p.mp_collector_id,
    p.mp_operation_type AS tipo_operacao,
        CASE
            WHEN ((p.mp_payment_method_id)::text = 'pix'::text) THEN 'PIX'::character varying
            WHEN ((p.mp_payment_method_id)::text = 'credit_card'::text) THEN 'Cartão de Crédito'::character varying
            WHEN ((p.mp_payment_method_id)::text = 'debit_card'::text) THEN 'Cartão de Débito'::character varying
            WHEN ((p.mp_payment_method_id)::text = 'bank_transfer'::text) THEN 'Transferência Bancária'::character varying
            WHEN ((p.mp_payment_method_id)::text = 'ticket'::text) THEN 'Boleto'::character varying
            ELSE COALESCE(p.mp_payment_method_id, 'Não informado'::character varying)
        END AS metodo_pagamento_descricao,
        CASE
            WHEN ((p.mp_status)::text = 'approved'::text) THEN 'Aprovado'::character varying
            WHEN ((p.mp_status)::text = 'rejected'::text) THEN 'Rejeitado'::character varying
            WHEN ((p.mp_status)::text = 'cancelled'::text) THEN 'Cancelado'::character varying
            WHEN ((p.mp_status)::text = 'pending'::text) THEN 'Pendente'::character varying
            WHEN ((p.mp_status)::text = 'in_process'::text) THEN 'Em Processamento'::character varying
            WHEN ((p.mp_status)::text = 'in_mediation'::text) THEN 'Em Mediação'::character varying
            ELSE COALESCE(p.mp_status, 'Não informado'::character varying)
        END AS status_pagamento_descricao,
        CASE
            WHEN (p.mp_transaction_amount IS NOT NULL) THEN round((p.mp_transaction_amount - p.valor_total), 2)
            ELSE NULL::numeric
        END AS diferenca_valor,
        CASE
            WHEN ((p.mp_date_approved IS NOT NULL) AND (p.mp_date_created IS NOT NULL)) THEN (EXTRACT(epoch FROM (p.mp_date_approved - p.mp_date_created)) / (60)::numeric)
            ELSE NULL::numeric
        END AS tempo_aprovacao_minutos,
    (p.mp_payment_id IS NOT NULL) AS tem_pagamento_mp,
    ((p.mp_status)::text = 'approved'::text) AS pagamento_aprovado,
    (p.mp_installments > 1) AS pagamento_parcelado,
    (p.mp_card_last_four_digits IS NOT NULL) AS pagamento_cartao
   FROM (public.pedidos p
     LEFT JOIN public.users u ON ((p.user_id = u.id)))
  ORDER BY p.created_at DESC;


--
-- Name: VIEW vw_payment_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_payment_details IS 'View com dados detalhados dos pagamentos do Mercado Pago, incluindo informações financeiras, métodos de pagamento e métricas calculadas';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: configuracoes configuracoes_chave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes
    ADD CONSTRAINT configuracoes_chave_key UNIQUE (chave);


--
-- Name: configuracoes configuracoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracoes
    ADD CONSTRAINT configuracoes_pkey PRIMARY KEY (id);


--
-- Name: itens_pedido itens_pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_pkey PRIMARY KEY (id);


--
-- Name: participantes participantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participantes
    ADD CONSTRAINT participantes_pkey PRIMARY KEY (id);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_itens_pedido_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_created_at ON public.itens_pedido USING btree (created_at DESC);


--
-- Name: idx_itens_pedido_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_pedido_id ON public.itens_pedido USING btree (pedido_id);


--
-- Name: idx_itens_pedido_preco; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_preco ON public.itens_pedido USING btree (preco_unitario);


--
-- Name: idx_itens_pedido_quantidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_quantidade ON public.itens_pedido USING btree (quantidade);


--
-- Name: idx_itens_pedido_tamanho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido_tamanho ON public.itens_pedido USING btree (tamanho);


--
-- Name: idx_participantes_cidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_cidade ON public.participantes USING btree (cidade);


--
-- Name: idx_participantes_cidade_igreja; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_cidade_igreja ON public.participantes USING btree (cidade, igreja);


--
-- Name: idx_participantes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_created_at ON public.participantes USING btree (created_at DESC);


--
-- Name: idx_participantes_igreja; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_igreja ON public.participantes USING btree (igreja);


--
-- Name: idx_participantes_item_pedido_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_item_pedido_id ON public.participantes USING btree (item_pedido_id);


--
-- Name: idx_participantes_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_nome ON public.participantes USING btree (nome);


--
-- Name: idx_participantes_tamanho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_tamanho ON public.participantes USING btree (tamanho);


--
-- Name: idx_participantes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participantes_user_id ON public.participantes USING btree (user_id);


--
-- Name: idx_pedidos_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_created_at ON public.pedidos USING btree (created_at DESC);


--
-- Name: idx_pedidos_mp_date_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_date_approved ON public.pedidos USING btree (mp_date_approved);


--
-- Name: idx_pedidos_mp_external_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_external_reference ON public.pedidos USING btree (mp_external_reference);


--
-- Name: idx_pedidos_mp_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_payment_id ON public.pedidos USING btree (mp_payment_id);


--
-- Name: idx_pedidos_mp_payment_method_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_payment_method_date ON public.pedidos USING btree (mp_payment_method_id, mp_date_approved);


--
-- Name: idx_pedidos_mp_payment_method_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_payment_method_id ON public.pedidos USING btree (mp_payment_method_id);


--
-- Name: idx_pedidos_mp_preference_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_preference_id ON public.pedidos USING btree (mp_preference_id);


--
-- Name: idx_pedidos_mp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_status ON public.pedidos USING btree (mp_status);


--
-- Name: idx_pedidos_mp_status_detail; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_status_detail ON public.pedidos USING btree (mp_status_detail);


--
-- Name: idx_pedidos_mp_transaction_amount; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_mp_transaction_amount ON public.pedidos USING btree (mp_transaction_amount);


--
-- Name: idx_pedidos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_status ON public.pedidos USING btree (status);


--
-- Name: idx_pedidos_status_mp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_status_mp_status ON public.pedidos USING btree (status, mp_status);


--
-- Name: idx_pedidos_tipo_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_tipo_pedido ON public.pedidos USING btree (tipo_pedido);


--
-- Name: idx_pedidos_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_user_id ON public.pedidos USING btree (user_id);


--
-- Name: idx_pedidos_valor_total; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_valor_total ON public.pedidos USING btree (valor_total);


--
-- Name: idx_users_cidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_cidade ON public.users USING btree (cidade);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_igreja; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_igreja ON public.users USING btree (igreja);


--
-- Name: idx_users_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_tipo ON public.users USING btree (tipo);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: itens_pedido trigger_auto_create_individual_participant; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_create_individual_participant AFTER INSERT ON public.itens_pedido FOR EACH ROW EXECUTE FUNCTION public.auto_create_individual_participant();


--
-- Name: TRIGGER trigger_auto_create_individual_participant ON itens_pedido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trigger_auto_create_individual_participant ON public.itens_pedido IS 'Trigger que cria participante automaticamente para pedidos individuais de jovens';


--
-- Name: itens_pedido update_pedido_total_after_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pedido_total_after_delete AFTER DELETE ON public.itens_pedido FOR EACH ROW EXECUTE FUNCTION public.update_pedido_total();


--
-- Name: itens_pedido update_pedido_total_after_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pedido_total_after_insert AFTER INSERT ON public.itens_pedido FOR EACH ROW EXECUTE FUNCTION public.update_pedido_total();


--
-- Name: itens_pedido update_pedido_total_after_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pedido_total_after_update AFTER UPDATE ON public.itens_pedido FOR EACH ROW EXECUTE FUNCTION public.update_pedido_total();


--
-- Name: pedidos update_pedidos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: participantes validate_participante_tamanho_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_participante_tamanho_before_insert BEFORE INSERT ON public.participantes FOR EACH ROW EXECUTE FUNCTION public.validate_participante_tamanho();


--
-- Name: participantes validate_participante_tamanho_before_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_participante_tamanho_before_update BEFORE UPDATE ON public.participantes FOR EACH ROW EXECUTE FUNCTION public.validate_participante_tamanho();


--
-- Name: participantes validate_participantes_quantidade_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_participantes_quantidade_before_insert BEFORE INSERT ON public.participantes FOR EACH ROW EXECUTE FUNCTION public.validate_participantes_quantidade();


--
-- Name: participantes validate_participantes_quantidade_before_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_participantes_quantidade_before_update BEFORE UPDATE ON public.participantes FOR EACH ROW EXECUTE FUNCTION public.validate_participantes_quantidade();


--
-- Name: itens_pedido validate_pedido_status_before_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_pedido_status_before_insert BEFORE INSERT ON public.itens_pedido FOR EACH ROW EXECUTE FUNCTION public.validate_pedido_status();


--
-- Name: itens_pedido validate_pedido_status_before_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_pedido_status_before_update BEFORE UPDATE ON public.itens_pedido FOR EACH ROW EXECUTE FUNCTION public.validate_pedido_status();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: itens_pedido itens_pedido_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_pedido
    ADD CONSTRAINT itens_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- Name: participantes participantes_item_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participantes
    ADD CONSTRAINT participantes_item_pedido_id_fkey FOREIGN KEY (item_pedido_id) REFERENCES public.itens_pedido(id) ON DELETE CASCADE;


--
-- Name: participantes participantes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participantes
    ADD CONSTRAINT participantes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pedidos pedidos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: configuracoes Admins can modify configurations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can modify configurations" ON public.configuracoes USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can modify configurations" ON configuracoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can modify configurations" ON public.configuracoes IS 'Administradores podem modificar configurações usando metadata do JWT';


--
-- Name: itens_pedido Admins can update all order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all order items" ON public.itens_pedido FOR UPDATE USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can update all order items" ON itens_pedido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can update all order items" ON public.itens_pedido IS 'Administradores podem atualizar todos os itens usando metadata do JWT';


--
-- Name: pedidos Admins can update all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all orders" ON public.pedidos FOR UPDATE USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can update all orders" ON pedidos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can update all orders" ON public.pedidos IS 'Administradores podem atualizar todos os pedidos usando metadata do JWT';


--
-- Name: participantes Admins can update all participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all participants" ON public.participantes FOR UPDATE USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can update all participants" ON participantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can update all participants" ON public.participantes IS 'Administradores podem atualizar todos os participantes usando metadata do JWT';


--
-- Name: users Admins can update all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can update all users" ON users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can update all users" ON public.users IS 'Administradores podem atualizar todos os usuários usando metadata do JWT';


--
-- Name: itens_pedido Admins can view all order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all order items" ON public.itens_pedido FOR SELECT USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can view all order items" ON itens_pedido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can view all order items" ON public.itens_pedido IS 'Administradores podem visualizar todos os itens usando metadata do JWT';


--
-- Name: pedidos Admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all orders" ON public.pedidos FOR SELECT USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can view all orders" ON pedidos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can view all orders" ON public.pedidos IS 'Administradores podem visualizar todos os pedidos usando metadata do JWT';


--
-- Name: participantes Admins can view all participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all participants" ON public.participantes FOR SELECT USING ((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'admin'::text));


--
-- Name: POLICY "Admins can view all participants" ON participantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Admins can view all participants" ON public.participantes IS 'Administradores podem visualizar todos os participantes usando metadata do JWT';


--
-- Name: users Admins can view all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());


--
-- Name: configuracoes Everyone can view configurations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view configurations" ON public.configuracoes FOR SELECT USING (true);


--
-- Name: users Leaders can view church members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leaders can view church members" ON public.users FOR SELECT USING (((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'lider'::text) AND (COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'igreja'::text), ''::text) = (igreja)::text)));


--
-- Name: POLICY "Leaders can view church members" ON users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Leaders can view church members" ON public.users IS 'Líderes podem visualizar membros da mesma igreja usando metadata do JWT';


--
-- Name: itens_pedido Leaders can view church order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leaders can view church order items" ON public.itens_pedido FOR SELECT USING (((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'lider'::text) AND (EXISTS ( SELECT 1
   FROM public.users u,
    public.pedidos p
  WHERE ((p.id = itens_pedido.pedido_id) AND (u.id = p.user_id) AND ((u.igreja)::text = COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'igreja'::text), ''::text)))))));


--
-- Name: POLICY "Leaders can view church order items" ON itens_pedido; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Leaders can view church order items" ON public.itens_pedido IS 'Líderes podem visualizar itens da mesma igreja usando metadata do JWT';


--
-- Name: pedidos Leaders can view church orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leaders can view church orders" ON public.pedidos FOR SELECT USING (((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'lider'::text) AND (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = pedidos.user_id) AND ((u.igreja)::text = COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'igreja'::text), ''::text)))))));


--
-- Name: POLICY "Leaders can view church orders" ON pedidos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Leaders can view church orders" ON public.pedidos IS 'Líderes podem visualizar pedidos da mesma igreja usando metadata do JWT';


--
-- Name: participantes Leaders can view church participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leaders can view church participants" ON public.participantes FOR SELECT USING (((COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'tipo'::text), ''::text) = 'lider'::text) AND (EXISTS ( SELECT 1
   FROM public.users u,
    public.pedidos p,
    public.itens_pedido ip
  WHERE ((ip.id = participantes.item_pedido_id) AND (p.id = ip.pedido_id) AND (u.id = p.user_id) AND ((u.igreja)::text = COALESCE(((auth.jwt() -> 'user_metadata'::text) ->> 'igreja'::text), ''::text)))))));


--
-- Name: POLICY "Leaders can view church participants" ON participantes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Leaders can view church participants" ON public.participantes IS 'Líderes podem visualizar participantes da mesma igreja usando metadata do JWT';


--
-- Name: pedidos Service role bypass RLS; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role bypass RLS" ON public.pedidos TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role bypass RLS" ON pedidos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role bypass RLS" ON public.pedidos IS 'Permite que service role (Edge Functions) bypasse completamente o RLS para operações do webhook';


--
-- Name: pedidos Users can create own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own orders" ON public.pedidos FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: participantes Users can delete own pending participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own pending participants" ON public.participantes FOR DELETE USING (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (public.itens_pedido ip
     JOIN public.pedidos p ON ((ip.pedido_id = p.id)))
  WHERE ((ip.id = participantes.item_pedido_id) AND (p.user_id = auth.uid()) AND ((p.status)::text = 'pendente'::text))))));


--
-- Name: itens_pedido Users can delete pending order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete pending order items" ON public.itens_pedido FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.pedidos
  WHERE ((pedidos.id = itens_pedido.pedido_id) AND (pedidos.user_id = auth.uid()) AND ((pedidos.status)::text = 'pendente'::text)))));


--
-- Name: itens_pedido Users can insert own order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own order items" ON public.itens_pedido FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.pedidos
  WHERE ((pedidos.id = itens_pedido.pedido_id) AND (pedidos.user_id = auth.uid())))));


--
-- Name: participantes Users can insert own participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own participants" ON public.participantes FOR INSERT WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (public.itens_pedido ip
     JOIN public.pedidos p ON ((ip.pedido_id = p.id)))
  WHERE ((ip.id = participantes.item_pedido_id) AND (p.user_id = auth.uid()) AND ((p.status)::text = 'pendente'::text))))));


--
-- Name: users Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: pedidos Users can update own pending orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own pending orders" ON public.pedidos FOR UPDATE USING (((user_id = auth.uid()) AND ((status)::text = 'pendente'::text)));


--
-- Name: participantes Users can update own pending participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own pending participants" ON public.participantes FOR UPDATE USING (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (public.itens_pedido ip
     JOIN public.pedidos p ON ((ip.pedido_id = p.id)))
  WHERE ((ip.id = participantes.item_pedido_id) AND (p.user_id = auth.uid()) AND ((p.status)::text = 'pendente'::text))))));


--
-- Name: users Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: itens_pedido Users can update pending order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update pending order items" ON public.itens_pedido FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.pedidos
  WHERE ((pedidos.id = itens_pedido.pedido_id) AND (pedidos.user_id = auth.uid()) AND ((pedidos.status)::text = 'pendente'::text)))));


--
-- Name: itens_pedido Users can view own order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own order items" ON public.itens_pedido FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.pedidos
  WHERE ((pedidos.id = itens_pedido.pedido_id) AND (pedidos.user_id = auth.uid())))));


--
-- Name: pedidos Users can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own orders" ON public.pedidos FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: participantes Users can view own participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own participants" ON public.participantes FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: users Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: pedidos Webhook can update payment status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Webhook can update payment status" ON public.pedidos FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: POLICY "Webhook can update payment status" ON pedidos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Webhook can update payment status" ON public.pedidos IS 'Política específica para permitir atualizações via webhook do Mercado Pago';


--
-- Name: configuracoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

--
-- Name: itens_pedido; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

--
-- Name: participantes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;

--
-- Name: pedidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict r9azn3QMC3OACtzJAtGox8fG1mZqATQY6wFvFmXGiV1Hv0PwNgZMchWaPrERem2

