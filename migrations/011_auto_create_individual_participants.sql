-- Migration: 011_auto_create_individual_participants.sql
-- Description: Criar trigger para automaticamente criar participante quando jovem faz pedido individual
-- Date: 2025-01-26

-- Função que cria participante automaticamente para pedidos individuais
CREATE OR REPLACE FUNCTION auto_create_individual_participant()
RETURNS TRIGGER AS $$
DECLARE
    pedido_record RECORD;
    user_record RECORD;
BEGIN
    -- Busca informações do pedido
    SELECT p.*, u.nome, u.email, u.tipo, u.cidade, u.igreja
    INTO pedido_record
    FROM pedidos p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = NEW.pedido_id;
    
    -- Se o pedido é individual (feito por jovem), cria participante automaticamente
    IF pedido_record.tipo_pedido = 'individual' THEN
        INSERT INTO participantes (
            item_pedido_id,
            user_id,
            nome,
            tamanho,
            cidade,
            igreja
        )
        VALUES (
            NEW.id,
            pedido_record.user_id,
            pedido_record.nome, -- Nome do próprio jovem que fez o pedido
            NEW.tamanho,
            pedido_record.cidade,
            pedido_record.igreja
        );
        
        -- Log para debug
        RAISE NOTICE 'Participante criado automaticamente para pedido individual: user_id=%, nome=%, tamanho=%', 
            pedido_record.user_id, pedido_record.nome, NEW.tamanho;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa após inserção de item_pedido
CREATE TRIGGER trigger_auto_create_individual_participant
    AFTER INSERT ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_individual_participant();

-- Comentários
COMMENT ON FUNCTION auto_create_individual_participant() IS 'Função que automaticamente cria um registro de participante quando um jovem faz um pedido individual';
COMMENT ON TRIGGER trigger_auto_create_individual_participant ON itens_pedido IS 'Trigger que cria participante automaticamente para pedidos individuais de jovens';

-- Criar participantes para pedidos individuais existentes que não têm participantes
-- (Para corrigir dados históricos)
INSERT INTO participantes (
    item_pedido_id,
    user_id,
    nome,
    tamanho,
    cidade,
    igreja
)
SELECT 
    ip.id as item_pedido_id,
    p.user_id,
    u.nome,
    ip.tamanho,
    u.cidade,
    u.igreja
FROM itens_pedido ip
JOIN pedidos p ON ip.pedido_id = p.id
JOIN users u ON p.user_id = u.id
WHERE p.tipo_pedido = 'individual'
  AND NOT EXISTS (
      SELECT 1 FROM participantes part 
      WHERE part.item_pedido_id = ip.id
  );

-- Log de quantos registros foram criados
DO $$
DECLARE
    count_created INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO count_created
    FROM itens_pedido ip
    JOIN pedidos p ON ip.pedido_id = p.id
    JOIN participantes part ON part.item_pedido_id = ip.id
    WHERE p.tipo_pedido = 'individual';
    
    RAISE NOTICE 'Total de participantes para pedidos individuais: %', count_created;
END
$$;