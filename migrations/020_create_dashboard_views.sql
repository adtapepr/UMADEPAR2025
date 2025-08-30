-- Criar views para o painel de controle administrativo

-- View completa de participantes com informações de pagamento
CREATE OR REPLACE VIEW public.vw_participantes_completo AS 
SELECT 
  p.id, 
  p.nome, 
  p.tamanho, 
  p.telefone, 
  p.cidade, 
  p.igreja, 
  p.observacoes, 
  p.created_at, 
  u.nome as comprador_nome, 
  u.email as comprador_email, 
  u.tipo as comprador_tipo, 
  ped.id as pedido_id, 
  ped.status as pedido_status, 
  ped.valor_total as pedido_valor, 
  ip.quantidade as item_quantidade, 
  ip.preco_unitario as item_preco, 
  CASE 
    WHEN ped.status::text = 'pago'::text 
      AND ped.mp_payment_id IS NOT NULL THEN ROUND( 
        ped.valor_total / NULLIF( 
          ( 
            SELECT 
              SUM(ip2.quantidade) as sum 
            FROM 
              itens_pedido ip2 
            WHERE 
              ip2.pedido_id = ped.id 
          ), 
          0 
        )::numeric, 
        2 
      ) 
    ELSE ip.preco_unitario 
  END as valor_real_pago 
FROM 
  participantes p 
  JOIN users u ON p.user_id = u.id 
  JOIN itens_pedido ip ON p.item_pedido_id = ip.id 
  JOIN pedidos ped ON ip.pedido_id = ped.id;

-- View detalhada de pagamentos
CREATE OR REPLACE VIEW public.vw_payment_details AS 
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
  p.mp_preference_id, 
  p.mp_payment_id, 
  p.mp_status, 
  p.mp_status_detail, 
  p.mp_external_reference, 
  p.mp_transaction_amount as valor_pago_real, 
  p.mp_currency_id as moeda, 
  p.mp_fee_amount as taxa_mp, 
  p.mp_net_amount as valor_liquido_recebido, 
  p.mp_payment_method_id as metodo_pagamento, 
  p.mp_payment_type_id as tipo_pagamento, 
  p.mp_installments as parcelas, 
  p.mp_date_created as data_criacao_pagamento, 
  p.mp_date_approved as data_aprovacao_pagamento, 
  p.mp_card_first_six_digits as bin_cartao, 
  p.mp_card_last_four_digits as final_cartao, 
  p.mp_issuer_id as banco_emissor, 
  p.mp_collector_id, 
  p.mp_operation_type as tipo_operacao, 
  CASE 
    WHEN p.mp_payment_method_id::text = 'pix'::text THEN 'PIX'::character varying 
    WHEN p.mp_payment_method_id::text = 'credit_card'::text THEN 'Cartão de Crédito'::character varying 
    WHEN p.mp_payment_method_id::text = 'debit_card'::text THEN 'Cartão de Débito'::character varying 
    WHEN p.mp_payment_method_id::text = 'bank_transfer'::text THEN 'Transferência Bancária'::character varying 
    WHEN p.mp_payment_method_id::text = 'ticket'::text THEN 'Boleto'::character varying 
    ELSE COALESCE( 
      p.mp_payment_method_id, 
      'Não informado'::character varying 
    ) 
  END as metodo_pagamento_descricao, 
  CASE 
    WHEN p.mp_status::text = 'approved'::text THEN 'Aprovado'::character varying 
    WHEN p.mp_status::text = 'rejected'::text THEN 'Rejeitado'::character varying 
    WHEN p.mp_status::text = 'cancelled'::text THEN 'Cancelado'::character varying 
    WHEN p.mp_status::text = 'pending'::text THEN 'Pendente'::character varying 
    WHEN p.mp_status::text = 'in_process'::text THEN 'Em Processamento'::character varying 
    WHEN p.mp_status::text = 'in_mediation'::text THEN 'Em Mediação'::character varying 
    ELSE COALESCE(p.mp_status, 'Não informado'::character varying) 
  END as status_pagamento_descricao, 
  CASE 
    WHEN p.mp_transaction_amount IS NOT NULL THEN ROUND(p.mp_transaction_amount - p.valor_total, 2) 
    ELSE NULL::numeric 
  END as diferenca_valor, 
  CASE 
    WHEN p.mp_date_approved IS NOT NULL 
      AND p.mp_date_created IS NOT NULL THEN EXTRACT( 
        epoch 
        FROM 
          p.mp_date_approved - p.mp_date_created 
      ) / 60::numeric 
    ELSE NULL::numeric 
  END as tempo_aprovacao_minutos, 
  p.mp_payment_id IS NOT NULL as tem_pagamento_mp, 
  p.mp_status::text = 'approved'::text as pagamento_aprovado, 
  p.mp_installments > 1 as pagamento_parcelado, 
  p.mp_card_last_four_digits IS NOT NULL as pagamento_cartao 
FROM 
  pedidos p 
  LEFT JOIN users u ON p.user_id = u.id 
ORDER BY 
  p.created_at DESC;

-- Habilitar RLS para as views
ALTER VIEW public.vw_participantes_completo OWNER TO postgres;
ALTER VIEW public.vw_payment_details OWNER TO postgres;

-- Conceder permissões
GRANT SELECT ON public.vw_participantes_completo TO authenticated;
GRANT SELECT ON public.vw_payment_details TO authenticated;
GRANT SELECT ON public.vw_participantes_completo TO anon;
GRANT SELECT ON public.vw_payment_details TO anon;