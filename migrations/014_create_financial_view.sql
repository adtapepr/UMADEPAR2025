-- Migration: 014_create_financial_view.sql
-- Description: Criar view para dados financeiros do dashboard administrativo
-- Date: 2025-01-25

-- Criar view com dados financeiros consolidados
CREATE OR REPLACE VIEW vw_dados_financeiros AS
SELECT 
    p.id as pedido_id,
    u.nome as comprador_nome,
    u.email as comprador_email,
    u.tipo as comprador_tipo,
    p.tipo_pedido,
    p.valor_total as valor_pedido_original,
    p.status as status_pedido,
    p.created_at as data_criacao_pedido,
    
    -- Dados financeiros do Mercado Pago
    COALESCE(p.mp_transaction_amount, 0) as valor_pago_real,
    COALESCE(p.mp_fee_amount, 0) as taxa_mp,
    COALESCE(p.mp_net_amount, 0) as valor_liquido_recebido,
    
    -- Método de pagamento
    CASE 
        WHEN p.mp_payment_method_id = 'pix' THEN 'pix'
        WHEN p.mp_payment_method_id = 'credit_card' THEN 'credit_card'
        WHEN p.mp_payment_method_id = 'debit_card' THEN 'debit_card'
        WHEN p.mp_payment_method_id = 'ticket' THEN 'boleto'
        WHEN p.mp_payment_method_id = 'bank_transfer' THEN 'transferencia'
        ELSE COALESCE(p.mp_payment_method_id, 'nao_informado')
    END as metodo_pagamento,
    
    -- Dados temporais
    p.mp_date_created as data_criacao_pagamento,
    p.mp_date_approved as data_aprovacao_pagamento,
    
    -- Dados do cartão (quando aplicável)
    p.mp_installments as parcelas,
    p.mp_card_last_four_digits as final_cartao,
    
    -- Status detalhado
    p.mp_status as status_mp,
    p.mp_status_detail as status_mp_detalhado,
    
    -- Campos calculados
    CASE 
        WHEN p.status = 'pago' AND p.mp_status = 'approved' THEN true
        ELSE false
    END as transacao_aprovada,
    
    CASE 
        WHEN p.mp_transaction_amount IS NOT NULL AND p.valor_total IS NOT NULL THEN 
            ROUND((p.mp_transaction_amount - p.valor_total)::numeric, 2)
        ELSE 0
    END as diferenca_valor,
    
    -- Tempo entre criação e aprovação (em minutos)
    CASE 
        WHEN p.mp_date_approved IS NOT NULL AND p.mp_date_created IS NOT NULL THEN
            EXTRACT(EPOCH FROM (p.mp_date_approved - p.mp_date_created))/60
        ELSE NULL
    END as tempo_aprovacao_minutos
    
FROM pedidos p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.status IN ('pago', 'pendente')
  AND p.mp_payment_id IS NOT NULL  -- Apenas pedidos que passaram pelo MP
ORDER BY p.mp_date_approved DESC NULLS LAST, p.created_at DESC;

-- Comentário na view
COMMENT ON VIEW vw_dados_financeiros IS 'View consolidada com dados financeiros para o dashboard administrativo, incluindo informações de pagamento do Mercado Pago';

-- Criar índices para otimizar consultas na view
-- (Os índices já existem nas tabelas base, mas vamos garantir os mais importantes)
CREATE INDEX IF NOT EXISTS idx_pedidos_financial_query ON pedidos(status, mp_payment_id, mp_date_approved);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_method_status ON pedidos(mp_payment_method_id, mp_status);

-- A view automaticamente herda as políticas RLS das tabelas pedidos e users