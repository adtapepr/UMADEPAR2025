-- Migração: 019_create_admin_user.sql
-- Descrição: Criar usuário administrador no sistema
-- Data: 2025-01-21

-- Inserir usuário admin diretamente na tabela public.users
-- O usuário precisará ser criado via interface de autenticação do Supabase
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
    pastor,
    created_at,
    updated_at
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@umadepar.com',
    'Administrador UMADEPAR',
    'admin',
    '(11) 99999-9999',
    'Endereço Administrativo',
    'São Paulo',
    'UMADEPAR',
    null,
    'Pastor Responsável',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    tipo = EXCLUDED.tipo,
    telefone = EXCLUDED.telefone,
    endereco = EXCLUDED.endereco,
    cidade = EXCLUDED.cidade,
    igreja = EXCLUDED.igreja,
    pastor = EXCLUDED.pastor,
    updated_at = NOW();

-- Log da operação
DO $$
BEGIN
    RAISE NOTICE 'Usuário administrador inserido na tabela public.users!';
    RAISE NOTICE 'ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    RAISE NOTICE 'Email: admin@umadepar.com';
    RAISE NOTICE 'Tipo: admin';
    RAISE NOTICE 'IMPORTANTE: Criar conta de autenticação no Supabase Auth com este email e ID!';
END $$;