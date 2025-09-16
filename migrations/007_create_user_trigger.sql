CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This is key
SET search_path = public
AS $$
BEGIN
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
  ) ON CONFLICT (id) DO NOTHING;  -- Added to prevent duplicate entries
  
  RETURN new;
END;
$$;

-- Revoke execute permissions from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Complete the trigger creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();