-- Migration: 006_update_tamanho_constraint.sql
-- Description: Atualizar constraint de tamanho para incluir XXG, E1, E2
-- Date: 2025-01-21

-- Remover a constraint antiga
ALTER TABLE itens_pedido DROP CONSTRAINT IF EXISTS itens_pedido_tamanho_check;

-- Adicionar a nova constraint com os tamanhos adicionais
ALTER TABLE itens_pedido ADD CONSTRAINT itens_pedido_tamanho_check 
    CHECK (tamanho IN ('P', 'M', 'G', 'GG', 'XG', 'XXG', 'E1', 'E2'));

-- Comentário explicativo
COMMENT ON CONSTRAINT itens_pedido_tamanho_check ON itens_pedido IS 
    'Constraint que valida os tamanhos permitidos: P, M, G, GG, XG, XXG, E1, E2';