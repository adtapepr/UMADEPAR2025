-- Migration: 013_create_payment_details_view.sql
-- Description: Criar view para consulta detalhada dos dados de pagamento do Mercado Pago
-- Date: 2025-01-25

-- Criar view com dados detalhados dos pagamentos
CREATE OR REPLACE VIEW vw_payment_details AS
SELECT 
    p.id as pedido_id,
    p.user_id,
    u.nome as comprador_nome,
    u.email as comprador_email,
    p.tipo_pedido,
    p.valor_total as valor_pedido_original,
    p.status as status_pedido,
    p.created_at as data_criacao_pedido,
    p.updated_at as data_atualizacao_pedido,
    
    -- Dados básicos do Mercado Pago
    p.mp_preference_id,
    p.mp_payment_id,
    p.mp_status,
    p.mp_status_detail,
    p.mp_external_reference,
    
    -- Dados financeiros
    p.mp_transaction_amount as valor_pago_real,
    p.mp_currency_id as moeda,
    p.mp_fee_amount as taxa_mp,
    p.mp_net_amount as valor_liquido_recebido,
    
    -- Dados do pagamento
    p.mp_payment_method_id as metodo_pagamento,
    p.mp_payment_type_id as tipo_pagamento,
    p.mp_installments as parcelas,
    p.mp_date_created as data_criacao_pagamento,
    p.mp_date_approved as data_aprovacao_pagamento,
    
    -- Dados do cartão (quando aplicável)
    p.mp_card_first_six_digits as bin_cartao,
    p.mp_card_last_four_digits as final_cartao,
    p.mp_issuer_id as banco_emissor,
    
    -- Dados operacionais
    p.mp_collector_id,
    p.mp_operation_type as tipo_operacao,
    
    -- Campos calculados
    CASE 
        WHEN p.mp_payment_method_id = 'pix' THEN 'PIX'
        WHEN p.mp_payment_method_id = 'credit_card' THEN 'Cartão de Crédito'
        WHEN p.mp_payment_method_id = 'debit_card' THEN 'Cartão de Débito'
        WHEN p.mp_payment_method_id = 'bank_transfer' THEN 'Transferência Bancária'
        WHEN p.mp_payment_method_id = 'ticket' THEN 'Boleto'
        ELSE COALESCE(p.mp_payment_method_id, 'Não informado')
    END as metodo_pagamento_descricao,
    
    CASE 
        WHEN p.mp_status = 'approved' THEN 'Aprovado'
        WHEN p.mp_status = 'rejected' THEN 'Rejeitado'
        WHEN p.mp_status = 'cancelled' THEN 'Cancelado'
        WHEN p.mp_status = 'pending' THEN 'Pendente'
        WHEN p.mp_status = 'in_process' THEN 'Em Processamento'
        WHEN p.mp_status = 'in_mediation' THEN 'Em Mediação'
        ELSE COALESCE(p.mp_status, 'Não informado')
    END as status_pagamento_descricao,
    
    -- Diferença entre valor pedido e valor pago
    CASE 
        WHEN p.mp_transaction_amount IS NOT NULL THEN 
            ROUND((p.mp_transaction_amount - p.valor_total)::numeric, 2)
        ELSE NULL
    END as diferenca_valor,
    
    -- Tempo entre criação e aprovação
    CASE 
        WHEN p.mp_date_approved IS NOT NULL AND p.mp_date_created IS NOT NULL THEN
            EXTRACT(EPOCH FROM (p.mp_date_approved - p.mp_date_created))/60
        ELSE NULL
    END as tempo_aprovacao_minutos,
    
    -- Indicadores booleanos
    (p.mp_payment_id IS NOT NULL) as tem_pagamento_mp,
    (p.mp_status = 'approved') as pagamento_aprovado,
    (p.mp_installments > 1) as pagamento_parcelado,
    (p.mp_card_last_four_digits IS NOT NULL) as pagamento_cartao
    
FROM pedidos p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- Comentário na view
COMMENT ON VIEW vw_payment_details IS 'View com dados detalhados dos pagamentos do Mercado Pago, incluindo informações financeiras, métodos de pagamento e métricas calculadas';

-- Criar índices para otimizar consultas na view
-- (Os índices já existem nas tabelas base, mas vamos garantir os mais importantes)
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment_method_date ON pedidos(mp_payment_method_id, mp_date_approved);
CREATE INDEX IF NOT EXISTS idx_pedidos_status_mp_status ON pedidos(status, mp_status);

-- Política de segurança para a view (herda das tabelas base)
-- A view automaticamente herda as políticas RLS das tabelas pedidos e users