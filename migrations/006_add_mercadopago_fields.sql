-- Migration: 006_add_mercadopago_fields.sql
-- Description: Adicionar campos para integração com Mercado Pago na tabela pedidos
-- Date: 2025-01-21

-- Adicionar campos para integração com Mercado Pago
ALTER TABLE public.pedidos
ADD COLUMN mp_preference_id TEXT, -- Armazena o ID da preferência de pagamento gerada
ADD COLUMN mp_payment_id BIGINT,  -- Armazena o ID do pagamento após ser aprovado
ADD COLUMN mp_status VARCHAR(50); -- Armazena o status textual do pagamento retornado pelo MP

-- Criar índices para otimização de consultas
CREATE INDEX idx_pedidos_mp_preference_id ON pedidos(mp_preference_id);
CREATE INDEX idx_pedidos_mp_payment_id ON pedidos(mp_payment_id);
CREATE INDEX idx_pedidos_mp_status ON pedidos(mp_status);

-- Comentários nas novas colunas
COMMENT ON COLUMN pedidos.mp_preference_id IS 'ID da preferência de pagamento gerada no Mercado Pago';
COMMENT ON COLUMN pedidos.mp_payment_id IS 'ID do pagamento confirmado no Mercado Pago';
COMMENT ON COLUMN pedidos.mp_status IS 'Status do pagamento retornado pelo Mercado Pago (approved, rejected, etc.)';

-- Política adicional: Permitir que Edge Functions atualizem campos do Mercado Pago
-- Isso é necessário para que o webhook possa atualizar o status dos pedidos
CREATE POLICY "Service role can update MP fields" ON pedidos
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Comentário sobre a nova política
COMMENT ON POLICY "Service role can update MP fields" ON pedidos IS 'Permite que Edge Functions (service role) atualizem campos do Mercado Pago via webhook';