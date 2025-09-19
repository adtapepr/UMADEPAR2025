-- Script para aplicar políticas RLS de DELETE para pedidos
-- Execute este script no SQL Editor do Supabase Dashboard

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

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'pedidos' AND cmd = 'DELETE';