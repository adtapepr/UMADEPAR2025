-- Script para recriar o trigger auto_create_individual_participant
-- Data: 2025-01-21

-- 1. Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_auto_create_individual_participant ON itens_pedido;

-- 2. Remover função existente se houver
DROP FUNCTION IF EXISTS auto_create_individual_participant();

-- 3. Recriar a função
CREATE OR REPLACE FUNCTION auto_create_individual_participant()
RETURNS TRIGGER AS $$
DECLARE
    pedido_tipo TEXT;
    user_data RECORD;
BEGIN
    -- Buscar o tipo do pedido e dados do usuário
    SELECT p.tipo_pedido, u.nome, u.cidade, u.igreja, u.user_id
    INTO pedido_tipo, user_data
    FROM pedidos p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = NEW.pedido_id;
    
    -- Se for pedido individual, criar participante automaticamente
    IF pedido_tipo = 'individual' THEN
        INSERT INTO participantes (
            item_pedido_id,
            user_id,
            nome,
            tamanho,
            cidade,
            igreja
        ) VALUES (
            NEW.id,
            user_data.user_id,
            user_data.nome,
            NEW.tamanho,
            user_data.cidade,
            user_data.igreja
        );
        
        RAISE NOTICE 'Participante criado automaticamente para item % do pedido individual %', NEW.id, NEW.pedido_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger
CREATE TRIGGER trigger_auto_create_individual_participant
    AFTER INSERT ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_individual_participant();

-- 5. Corrigir dados históricos - criar participantes para itens individuais existentes sem participantes
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
    u.id as user_id,
    u.nome,
    ip.tamanho,
    u.cidade,
    u.igreja
FROM itens_pedido ip
JOIN pedidos p ON ip.pedido_id = p.id
JOIN users u ON p.user_id = u.id
LEFT JOIN participantes part ON part.item_pedido_id = ip.id
WHERE p.tipo_pedido = 'individual'
  AND part.id IS NULL;

-- 6. Verificar resultados
SELECT 
    'Participantes criados' as status,
    COUNT(*) as total
FROM participantes;

SELECT 
    'Itens individuais sem participantes' as status,
    COUNT(*) as total
FROM itens_pedido ip
JOIN pedidos p ON ip.pedido_id = p.id
LEFT JOIN participantes part ON part.item_pedido_id = ip.id
WHERE p.tipo_pedido = 'individual'
  AND part.id IS NULL;

-- Log de sucesso
RAISE NOTICE 'Trigger auto_create_individual_participant recriado com sucesso!';
RAISE NOTICE 'Dados históricos corrigidos!';