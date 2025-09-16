-- Migration: 011_update_view_with_mp_amount.sql
-- Description: Atualizar view vw_participantes_completo para incluir valor real do Mercado Pago
-- Date: 2025-01-25

-- Remover a view existente
DROP VIEW IF EXISTS vw_participantes_completo;

-- Recriar a view com o valor real do Mercado Pago
CREATE VIEW vw_participantes_completo AS
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
    -- Valor real pago pelo Mercado Pago (quando disponível)
    CASE 
        WHEN ped.status = 'pago' AND ped.mp_payment_id IS NOT NULL THEN 
            -- Para pedidos pagos, usar o valor total do pedido dividido pela quantidade de itens
            ROUND((ped.valor_total / NULLIF(
                (SELECT SUM(ip2.quantidade) 
                 FROM itens_pedido ip2 
                 WHERE ip2.pedido_id = ped.id), 0
            ))::numeric, 2)
        ELSE 
            -- Para pedidos não pagos, usar o preço unitário original
            ip.preco_unitario
    END as valor_real_pago
FROM participantes p
JOIN users u ON p.user_id = u.id
JOIN itens_pedido ip ON p.item_pedido_id = ip.id
JOIN pedidos ped ON ip.pedido_id = ped.id;

-- Conceder permissões na view
GRANT SELECT ON vw_participantes_completo TO authenticated;

-- Comentário na view
COMMENT ON VIEW vw_participantes_completo IS 'View com dados completos dos participantes incluindo valor real pago pelo Mercado Pago';
COMMENT ON COLUMN vw_participantes_completo.valor_real_pago IS 'Valor real pago por item quando o pedido foi aprovado pelo Mercado Pago';