-- Migration: 012_add_detailed_mp_fields.sql
-- Description: Adicionar campos detalhados do Mercado Pago na tabela pedidos
-- Date: 2025-01-25

-- Adicionar campos detalhados do pagamento do Mercado Pago
ALTER TABLE public.pedidos
ADD COLUMN mp_transaction_amount DECIMAL(10,2),     -- Valor real pago no MP
ADD COLUMN mp_currency_id VARCHAR(3),              -- Moeda (BRL, USD, etc.)
ADD COLUMN mp_payment_method_id VARCHAR(50),       -- Método de pagamento (pix, credit_card, etc.)
ADD COLUMN mp_payment_type_id VARCHAR(50),         -- Tipo de pagamento (account_money, credit_card, etc.)
ADD COLUMN mp_date_created TIMESTAMP WITH TIME ZONE, -- Data de criação do pagamento no MP
ADD COLUMN mp_date_approved TIMESTAMP WITH TIME ZONE, -- Data de aprovação do pagamento
ADD COLUMN mp_status_detail VARCHAR(100),          -- Detalhes do status (accredited, pending_waiting_payment, etc.)
ADD COLUMN mp_external_reference VARCHAR(255),     -- Referência externa (nosso order ID)
ADD COLUMN mp_collector_id BIGINT,                 -- ID do coletor no MP
ADD COLUMN mp_operation_type VARCHAR(50),          -- Tipo de operação (regular_payment, etc.)
ADD COLUMN mp_installments INTEGER,                -- Número de parcelas
ADD COLUMN mp_issuer_id VARCHAR(50),               -- ID do emissor do cartão
ADD COLUMN mp_card_last_four_digits VARCHAR(4),    -- Últimos 4 dígitos do cartão
ADD COLUMN mp_card_first_six_digits VARCHAR(6),    -- Primeiros 6 dígitos do cartão
ADD COLUMN mp_fee_amount DECIMAL(10,2),            -- Taxa cobrada pelo MP
ADD COLUMN mp_net_amount DECIMAL(10,2);            -- Valor líquido recebido

-- Criar índices para otimização de consultas nos novos campos
CREATE INDEX idx_pedidos_mp_transaction_amount ON pedidos(mp_transaction_amount);
CREATE INDEX idx_pedidos_mp_payment_method_id ON pedidos(mp_payment_method_id);
CREATE INDEX idx_pedidos_mp_date_approved ON pedidos(mp_date_approved);
CREATE INDEX idx_pedidos_mp_status_detail ON pedidos(mp_status_detail);
CREATE INDEX idx_pedidos_mp_external_reference ON pedidos(mp_external_reference);

-- Comentários nas novas colunas
COMMENT ON COLUMN pedidos.mp_transaction_amount IS 'Valor real da transação pago no Mercado Pago';
COMMENT ON COLUMN pedidos.mp_currency_id IS 'Moeda utilizada na transação (BRL, USD, etc.)';
COMMENT ON COLUMN pedidos.mp_payment_method_id IS 'Método de pagamento utilizado (pix, credit_card, debit_card, etc.)';
COMMENT ON COLUMN pedidos.mp_payment_type_id IS 'Tipo de pagamento (account_money, credit_card, debit_card, etc.)';
COMMENT ON COLUMN pedidos.mp_date_created IS 'Data e hora de criação do pagamento no Mercado Pago';
COMMENT ON COLUMN pedidos.mp_date_approved IS 'Data e hora de aprovação do pagamento no Mercado Pago';
COMMENT ON COLUMN pedidos.mp_status_detail IS 'Detalhes específicos do status do pagamento';
COMMENT ON COLUMN pedidos.mp_external_reference IS 'Referência externa do pagamento (ID do pedido no nosso sistema)';
COMMENT ON COLUMN pedidos.mp_collector_id IS 'ID do coletor/vendedor no Mercado Pago';
COMMENT ON COLUMN pedidos.mp_operation_type IS 'Tipo de operação do pagamento (regular_payment, money_transfer, etc.)';
COMMENT ON COLUMN pedidos.mp_installments IS 'Número de parcelas do pagamento';
COMMENT ON COLUMN pedidos.mp_issuer_id IS 'ID do banco emissor do cartão';
COMMENT ON COLUMN pedidos.mp_card_last_four_digits IS 'Últimos 4 dígitos do cartão utilizado';
COMMENT ON COLUMN pedidos.mp_card_first_six_digits IS 'Primeiros 6 dígitos do cartão (BIN)';
COMMENT ON COLUMN pedidos.mp_fee_amount IS 'Taxa cobrada pelo Mercado Pago';
COMMENT ON COLUMN pedidos.mp_net_amount IS 'Valor líquido recebido após taxas';

-- Atualizar a política existente para incluir os novos campos
DROP POLICY IF EXISTS "Service role can update MP fields" ON pedidos;
CREATE POLICY "Service role can update MP fields" ON pedidos
    FOR UPDATE USING (true)
    WITH CHECK (true);

COMMENT ON POLICY "Service role can update MP fields" ON pedidos IS 'Permite que Edge Functions (service role) atualizem todos os campos do Mercado Pago via webhook';