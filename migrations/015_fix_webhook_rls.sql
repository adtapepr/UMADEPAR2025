-- Migration: 015_fix_webhook_rls.sql
-- Description: Corrigir políticas RLS para permitir webhook do Mercado Pago
-- Date: 2025-01-27

-- Remover política existente que pode estar causando conflitos
DROP POLICY IF EXISTS "Service role can update MP fields" ON pedidos;

-- Criar política específica para service role que bypassa RLS completamente
CREATE POLICY "Service role bypass RLS" ON pedidos
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Garantir que service role pode fazer qualquer operação na tabela pedidos
GRANT ALL ON pedidos TO service_role;

-- Criar política adicional para permitir atualizações via webhook sem autenticação
-- Esta política é específica para Edge Functions que usam SERVICE_ROLE_KEY
CREATE POLICY "Webhook can update payment status" ON pedidos
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Comentários explicativos
COMMENT ON POLICY "Service role bypass RLS" ON pedidos IS 'Permite que service role (Edge Functions) bypasse completamente o RLS para operações do webhook';
COMMENT ON POLICY "Webhook can update payment status" ON pedidos IS 'Política específica para permitir atualizações via webhook do Mercado Pago';

-- Verificar se RLS está habilitado (deve estar)
-- ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY; -- Já está habilitado

-- Log da migração
INSERT INTO configuracoes (chave, valor, descricao) VALUES
('migration_015_applied', 'true', 'Migração 015 aplicada: Correção de políticas RLS para webhook')
ON CONFLICT (chave) DO UPDATE SET 
    valor = EXCLUDED.valor,
    updated_at = NOW();