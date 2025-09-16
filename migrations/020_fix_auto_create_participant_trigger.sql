-- Migração: 020_fix_auto_create_participant_trigger.sql
-- Descrição: Corrigir e recriar o trigger auto_create_individual_participant
-- Data: 2025-01-21

-- 1. Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_auto_create_individual_participant ON itens_pedido;

-- 2. Remover função existente se houver
DROP FUNCTION IF EXISTS auto_create_individual_participant();

-- 3. Recriar a função corrigida
CREATE OR REPLACE FUNCTION auto_create_individual_participant()
RETURNS TRIGGER AS $$
DECLARE
    -- tipo do pedido (individual ou outro)
    pedido_tipo TEXT;

    -- dados do usuário que fez o pedido
    user_id      UUID;
    user_nome    TEXT;
    user_cidade  TEXT;
    user_igreja  TEXT;
    user_telefone TEXT;
BEGIN
    ----------------------------------------------------------------------
    -- 1️⃣  Busca o tipo do pedido e os dados do usuário associados
    ----------------------------------------------------------------------
    SELECT
        p.tipo_pedido,
        u.id,
        u.nome,
        u.cidade,
        u.igreja,
        u.telefone
    INTO
        pedido_tipo,
        user_id,
        user_nome,
        user_cidade,
        user_igreja,
        user_telefone
    FROM   pedidos p
    JOIN   users u ON p.user_id = u.id
    WHERE  p.id = NEW.pedido_id;

    ----------------------------------------------------------------------
    -- 2️⃣  Se for um pedido *individual*, cria o participante automaticamente
    ----------------------------------------------------------------------
    IF pedido_tipo = 'individual' THEN
        INSERT INTO participantes (
            item_pedido_id,
            user_id,
            nome,
            tamanho,
            telefone,
            cidade,
            igreja
        ) VALUES (
            NEW.id,          -- item_pedido_id
            user_id,         -- user_id (do usuário que fez o pedido)
            user_nome,       -- nome
            NEW.tamanho,    -- tamanho (do item)
            user_telefone,  -- telefone
            user_cidade,    -- cidade
            user_igreja     -- igreja
        );

        RAISE NOTICE
            'Participante criado automaticamente para item % do pedido individual %',
            NEW.id,
            NEW.pedido_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger
CREATE TRIGGER trigger_auto_create_individual_participant
    AFTER INSERT ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_individual_participant();

-- 5. Corrigir dados históricos – criar participantes para itens individuais que ainda não têm
INSERT INTO participantes (
    item_pedido_id,
    user_id,
    nome,
    tamanho,
    telefone,
    cidade,
    igreja
)
SELECT
    ip.id          AS item_pedido_id,
    u.id           AS user_id,
    u.nome,
    ip.tamanho,
    u.telefone,
    u.cidade,
    u.igreja
FROM   itens_pedido ip
JOIN   pedidos p   ON ip.pedido_id = p.id
JOIN   users   u   ON p.user_id   = u.id
LEFT   JOIN participantes part ON part.item_pedido_id = ip.id
WHERE  p.tipo_pedido = 'individual'
  AND  part.id IS NULL;

-- 6. Log de sucesso (bloco anônimo)
DO $$
BEGIN
    RAISE NOTICE 'Trigger auto_create_individual_participant recriado com sucesso!';
    RAISE NOTICE 'Dados históricos corrigidos!';
    RAISE NOTICE 'Total de participantes: %', (SELECT COUNT(*) FROM participantes);
    RAISE NOTICE 'Itens individuais sem participantes: %',
        (SELECT COUNT(*)
         FROM itens_pedido ip
         JOIN pedidos p ON ip.pedido_id = p.id
         LEFT JOIN participantes part ON part.item_pedido_id = ip.id
         WHERE p.tipo_pedido = 'individual' AND part.id IS NULL);
END $$;