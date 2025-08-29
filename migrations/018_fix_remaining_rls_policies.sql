-- Migração: 018_fix_remaining_rls_policies.sql
-- Descrição: Corrigir políticas RLS recursivas restantes nas tabelas pedidos, itens_pedido e participantes
-- Data: 2025-01-21

-- TABELA PEDIDOS
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all orders" ON pedidos;
DROP POLICY IF EXISTS "Admins can update all orders" ON pedidos;
DROP POLICY IF EXISTS "Leaders can view church orders" ON pedidos;

-- Criar novas políticas para administradores usando auth.jwt()
CREATE POLICY "Admins can view all orders" ON pedidos
    FOR SELECT USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

CREATE POLICY "Admins can update all orders" ON pedidos
    FOR UPDATE USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

-- Criar política para líderes usando auth.jwt()
CREATE POLICY "Leaders can view church orders" ON pedidos
    FOR SELECT USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'lider' AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = pedidos.user_id 
            AND u.igreja = COALESCE((auth.jwt()->'user_metadata'->>'igreja')::text, '')
        )
    );

-- TABELA ITENS_PEDIDO
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all order items" ON itens_pedido;
DROP POLICY IF EXISTS "Admins can update all order items" ON itens_pedido;
DROP POLICY IF EXISTS "Leaders can view church order items" ON itens_pedido;

-- Criar novas políticas para administradores usando auth.jwt()
CREATE POLICY "Admins can view all order items" ON itens_pedido
    FOR SELECT USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

CREATE POLICY "Admins can update all order items" ON itens_pedido
    FOR UPDATE USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

-- Criar política para líderes usando auth.jwt()
CREATE POLICY "Leaders can view church order items" ON itens_pedido
    FOR SELECT USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'lider' AND
        EXISTS (
            SELECT 1 FROM users u, pedidos p
            WHERE p.id = itens_pedido.pedido_id
            AND u.id = p.user_id 
            AND u.igreja = COALESCE((auth.jwt()->'user_metadata'->>'igreja')::text, '')
        )
    );

-- TABELA PARTICIPANTES
-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Admins can view all participants" ON participantes;
DROP POLICY IF EXISTS "Admins can update all participants" ON participantes;
DROP POLICY IF EXISTS "Leaders can view church participants" ON participantes;

-- Criar novas políticas para administradores usando auth.jwt()
CREATE POLICY "Admins can view all participants" ON participantes
    FOR SELECT USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

CREATE POLICY "Admins can update all participants" ON participantes
    FOR UPDATE USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

-- Criar política para líderes usando auth.jwt()
CREATE POLICY "Leaders can view church participants" ON participantes
    FOR SELECT USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'lider' AND
        EXISTS (
            SELECT 1 FROM users u, pedidos p, itens_pedido ip
            WHERE ip.id = participantes.item_pedido_id
            AND p.id = ip.pedido_id
            AND u.id = p.user_id 
            AND u.igreja = COALESCE((auth.jwt()->'user_metadata'->>'igreja')::text, '')
        )
    );

-- TABELA CONFIGURACOES
-- Remover política problemática
DROP POLICY IF EXISTS "Admins can modify configurations" ON configuracoes;

-- Criar nova política para administradores usando auth.jwt()
CREATE POLICY "Admins can modify configurations" ON configuracoes
    FOR ALL USING (
        COALESCE((auth.jwt()->'user_metadata'->>'tipo')::text, '') = 'admin'
    );

-- Comentários
COMMENT ON POLICY "Admins can view all orders" ON pedidos IS 'Administradores podem visualizar todos os pedidos usando metadata do JWT';
COMMENT ON POLICY "Admins can update all orders" ON pedidos IS 'Administradores podem atualizar todos os pedidos usando metadata do JWT';
COMMENT ON POLICY "Leaders can view church orders" ON pedidos IS 'Líderes podem visualizar pedidos da mesma igreja usando metadata do JWT';

COMMENT ON POLICY "Admins can view all order items" ON itens_pedido IS 'Administradores podem visualizar todos os itens usando metadata do JWT';
COMMENT ON POLICY "Admins can update all order items" ON itens_pedido IS 'Administradores podem atualizar todos os itens usando metadata do JWT';
COMMENT ON POLICY "Leaders can view church order items" ON itens_pedido IS 'Líderes podem visualizar itens da mesma igreja usando metadata do JWT';

COMMENT ON POLICY "Admins can view all participants" ON participantes IS 'Administradores podem visualizar todos os participantes usando metadata do JWT';
COMMENT ON POLICY "Admins can update all participants" ON participantes IS 'Administradores podem atualizar todos os participantes usando metadata do JWT';
COMMENT ON POLICY "Leaders can view church participants" ON participantes IS 'Líderes podem visualizar participantes da mesma igreja usando metadata do JWT';

COMMENT ON POLICY "Admins can modify configurations" ON configuracoes IS 'Administradores podem modificar configurações usando metadata do JWT';