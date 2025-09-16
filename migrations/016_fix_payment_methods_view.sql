-- Remove the old view (if it exists)
DROP VIEW IF EXISTS public.vw_payment_details;

-- Re‑create the view with the correct column list & order
CREATE VIEW public.vw_payment_details AS
SELECT 
    p.id                         AS pedido_id,
    p.user_id,
    u.nome                       AS comprador_nome,
    u.email                      AS comprador_email,
    p.tipo_pedido,
    p.valor_total                AS valor_pedido_original,
    p.status                     AS status_pedido,
    p.created_at                 AS data_criacao_pedido,
    p.updated_at                 AS data_atualizacao_pedido,
    p.mp_preference_id,
    p.mp_payment_id,
    p.mp_status,
    p.mp_status_detail,
    p.mp_external_reference,
    p.mp_transaction_amount      AS valor_pago_real,
    p.mp_currency_id             AS moeda,
    p.mp_fee_amount              AS taxa_mp,
    p.mp_net_amount              AS valor_liquido_recebido,
    p.mp_payment_method_id,                     -- <-- keep this column
    p.mp_payment_type_id         AS tipo_pagamento,
    p.mp_installments            AS parcelas,
    p.mp_date_created            AS data_criacao_pagamento,
    p.mp_date_approved           AS data_aprovacao_pagamento,
    p.mp_card_first_six_digits   AS bin_cartao,
    p.mp_card_last_four_digits   AS final_cartao,
    p.mp_issuer_id               AS banco_emissor,
    p.mp_collector_id,
    p.mp_operation_type          AS tipo_operacao,

    -------------------------------------------------
    -- 1️⃣ Categorização (metodo_pagamento) – **must stay after the column above**
    CASE 
        WHEN p.mp_payment_type_id = 'account_money'   THEN 'account_money'
        WHEN p.mp_payment_type_id = 'ticket'          THEN 'ticket'
        WHEN p.mp_payment_type_id = 'bank_transfer'  THEN 'PIX'
        WHEN p.mp_payment_type_id = 'atm'            THEN 'atm'
        WHEN p.mp_payment_type_id = 'credit_card'    THEN 'credit_card'
        WHEN p.mp_payment_type_id = 'debit_card'     THEN 'debit_card'
        WHEN p.mp_payment_type_id = 'prepaid_card'   THEN 'prepaid_card'
        WHEN p.mp_payment_type_id = 'digital_currency' THEN 'digital_currency'
        WHEN p.mp_payment_type_id = 'digital_wallet' THEN 'digital_wallet'
        WHEN p.mp_payment_type_id = 'voucher_card'   THEN 'voucher_card'
        WHEN p.mp_payment_type_id = 'crypto_transfer' THEN 'crypto_transfer'
        WHEN p.mp_payment_type_id = 'pix'            THEN 'pix'
        ELSE 'other'
    END AS metodo_pagamento,

    -------------------------------------------------
    -- 2️⃣ Descrição amigável
    CASE 
        WHEN p.mp_payment_type_id = 'account_money'   THEN 'Mercado Pago'
        WHEN p.mp_payment_type_id = 'ticket'          THEN 'Boleto'
        WHEN p.mp_payment_type_id = 'bank_transfer'  THEN 'PIX'
        WHEN p.mp_payment_type_id = 'atm'            THEN 'Caixa Eletrônico'
        WHEN p.mp_payment_type_id = 'credit_card'    THEN 'Cartão de Crédito'
        WHEN p.mp_payment_type_id = 'debit_card'     THEN 'Cartão de Débito'
        WHEN p.mp_payment_type_id = 'prepaid_card'   THEN 'Cartão Pré-pago'
        WHEN p.mp_payment_type_id = 'digital_currency' THEN 'Moeda Digital'
        WHEN p.mp_payment_type_id = 'digital_wallet' THEN 'Carteira Digital'
        WHEN p.mp_payment_type_id = 'voucher_card'   THEN 'Cartão Voucher'
        WHEN p.mp_payment_type_id = 'crypto_transfer' THEN 'Transferência Crypto'
        WHEN p.mp_payment_type_id = 'pix'            THEN 'PIX'
        ELSE 'Outros'
    END AS metodo_pagamento_descricao,

    -------------------------------------------------
    -- 3️⃣ Status em português
    CASE 
        WHEN p.mp_status = 'approved'      THEN 'Aprovado'
        WHEN p.mp_status = 'pending'       THEN 'Pendente'
        WHEN p.mp_status = 'authorized'    THEN 'Autorizado'
        WHEN p.mp_status = 'in_process'    THEN 'Em Processamento'
        WHEN p.mp_status = 'in_mediation'  THEN 'Em Mediação'
        WHEN p.mp_status = 'rejected'      THEN 'Rejeitado'
        WHEN p.mp_status = 'cancelled'     THEN 'Cancelado'
        WHEN p.mp_status = 'refunded'      THEN 'Reembolsado'
        WHEN p.mp_status = 'charged_back' THEN 'Estornado'
        ELSE p.mp_status
    END AS status_pagamento_descricao,

    -------------------------------------------------
    -- 4️⃣ Diferença de valores
    CASE 
        WHEN p.mp_transaction_amount IS NOT NULL 
           THEN ROUND(p.mp_transaction_amount - p.valor_total, 2)
        ELSE NULL
    END AS diferenca_valor,

    -------------------------------------------------
    -- 5️⃣ Tempo de aprovação (minutos)
    CASE 
        WHEN p.mp_date_approved IS NOT NULL 
         AND p.mp_date_created  IS NOT NULL 
           THEN EXTRACT(EPOCH FROM (p.mp_date_approved - p.mp_date_created)) / 60
        ELSE NULL
    END AS tempo_aprovacao_minutos,

    -------------------------------------------------
    -- 6️⃣ Indicadores booleanos
    p.mp_payment_id IS NOT NULL                     AS tem_pagamento_mp,
    p.mp_status = 'approved'                        AS pagamento_aprovado,
    p.mp_installments > 1                           AS pagamento_parcelado,
    p.mp_card_last_four_digits IS NOT NULL          AS pagamento_cartao

FROM pedidos p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;