-- Migração: Adicionar políticas RLS de DELETE para administradores
-- Data: 2025-01-18
-- Descrição: Permite que administradores excluam itens de pedidos e participantes

-- Política: Administradores podem deletar todos os itens de pedidos
CREATE POLICY "Admins can delete all order items" ON itens_pedido
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Administradores podem deletar todos os participantes
CREATE POLICY "Admins can delete all participants" ON participantes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('itens_pedido', 'participantes') 
AND cmd = 'DELETE'
ORDER BY tablename, policyname;