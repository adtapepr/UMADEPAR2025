-- Atualizar o trigger para também definir o display_name na tabela auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Revogar permissões de execução de roles públicos
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;