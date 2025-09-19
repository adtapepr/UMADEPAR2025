-- Migration: 021_add_delete_policy_pedidos.sql
-- Description: Adicionar política RLS para permitir exclusão de pedidos pendentes
-- Date: 2025-01-21

-- Política: Usuários podem excluir seus próprios pedidos pendentes
CREATE POLICY "Users can delete own pending orders" ON pedidos
    FOR DELETE USING (
        user_id = auth.uid() 
        AND status = 'pendente'
    );

-- Política: Administradores podem excluir qualquer pedido
CREATE POLICY "Admins can delete all orders" ON pedidos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Comentário sobre as novas políticas
COMMENT ON POLICY "Users can delete own pending orders" ON pedidos IS 'Permite que usuários excluam apenas seus próprios pedidos com status pendente';
COMMENT ON POLICY "Admins can delete all orders" ON pedidos IS 'Permite que administradores excluam qualquer pedido do sistema';