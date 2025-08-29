-- Migração: 015_update_user_metadata.sql
-- Descrição: Criar função para atualizar user_metadata no JWT após login
-- Data: 2025-01-21

-- Função para atualizar os metadados do usuário no auth.users
CREATE OR REPLACE FUNCTION public.update_user_metadata(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data RECORD;
BEGIN
  -- Buscar dados do usuário na tabela public.users
  SELECT tipo, igreja, nome INTO user_data
  FROM public.users
  WHERE id = user_id;
  
  -- Se encontrou o usuário, atualizar os metadados
  IF FOUND THEN
    UPDATE auth.users
    SET 
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object(
          'tipo', user_data.tipo,
          'igreja', user_data.igreja,
          'nome', user_data.nome
        )
    WHERE id = user_id;
    
    RAISE LOG 'Metadados atualizados para usuário %: tipo=%, igreja=%', user_id, user_data.tipo, user_data.igreja;
  END IF;
END;
$$;

-- Revogar permissões públicas
REVOKE EXECUTE ON FUNCTION public.update_user_metadata(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_metadata(uuid) FROM anon, authenticated;

-- Conceder permissão apenas para service_role
GRANT EXECUTE ON FUNCTION public.update_user_metadata(uuid) TO service_role;

-- Função para ser chamada via RPC pelo frontend
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Chamar a função de atualização
  PERFORM public.update_user_metadata(current_user_id);
END;
$$;

-- Conceder permissão para usuários autenticados chamarem a função sync
GRANT EXECUTE ON FUNCTION public.sync_user_metadata() TO authenticated;

-- Comentários
COMMENT ON FUNCTION public.update_user_metadata(uuid) IS 'Atualiza os metadados do usuário no JWT com dados da tabela users';
COMMENT ON FUNCTION public.sync_user_metadata() IS 'Sincroniza metadados do usuário atual - pode ser chamada pelo frontend';