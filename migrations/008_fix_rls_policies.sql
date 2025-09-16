-- Migração: 008_fix_rls_policies.sql
-- Descrição: Corrigir políticas RLS que causam recursão infinita
-- Data: 2025-01-21

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Leaders can view church members" ON users;

-- Criar nova política para administradores usando auth.jwt()
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        -- Usar coalesce para lidar com valores potencialmente nulos
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

-- Criar política para líderes usando auth.jwt()
CREATE POLICY "Leaders can view church members" ON users
    FOR SELECT USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'lider' AND
        COALESCE((auth.jwt()->'user_metadata'->>'igreja')::text, '') = igreja
    );

-- Comentários
COMMENT ON POLICY "Admins can view all users" ON users IS 'Administradores podem visualizar todos os usuários usando metadata do JWT';
COMMENT ON POLICY "Admins can update all users" ON users IS 'Administradores podem atualizar todos os usuários usando metadata do JWT';
COMMENT ON POLICY "Leaders can view church members" ON users IS 'Líderes podem visualizar membros da mesma igreja usando metadata do JWT';