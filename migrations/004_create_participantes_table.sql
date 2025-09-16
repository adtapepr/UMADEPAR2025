-- Migration: 004_create_participantes_table.sql
-- Description: Criar tabela de participantes com dados dos compradores
-- Date: 2025-01-21

-- Criar tabela participantes
CREATE TABLE participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_pedido_id UUID NOT NULL REFERENCES itens_pedido(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tamanho VARCHAR(5) NOT NULL CHECK (tamanho IN ('P', 'M', 'G', 'GG', 'XG')),
    telefone VARCHAR(20),
    cidade VARCHAR(100),
    igreja VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimização de consultas
CREATE INDEX idx_participantes_item_pedido_id ON participantes(item_pedido_id);
CREATE INDEX idx_participantes_user_id ON participantes(user_id);
CREATE INDEX idx_participantes_nome ON participantes(nome);
CREATE INDEX idx_participantes_cidade ON participantes(cidade);
CREATE INDEX idx_participantes_igreja ON participantes(igreja);
CREATE INDEX idx_participantes_tamanho ON participantes(tamanho);
CREATE INDEX idx_participantes_created_at ON participantes(created_at DESC);

-- Índice composto para busca por cidade e igreja
CREATE INDEX idx_participantes_cidade_igreja ON participantes(cidade, igreja);

-- Habilitar Row Level Security
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar seus próprios participantes
CREATE POLICY "Users can view own participants" ON participantes
    FOR SELECT USING (user_id = auth.uid());

-- Política: Usuários podem inserir participantes em seus próprios pedidos
CREATE POLICY "Users can insert own participants" ON participantes
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM itens_pedido ip
            JOIN pedidos p ON ip.pedido_id = p.id
            WHERE ip.id = item_pedido_id 
            AND p.user_id = auth.uid()
            AND p.status = 'pendente'
        )
    );

-- Política: Usuários podem atualizar participantes de pedidos pendentes
CREATE POLICY "Users can update own pending participants" ON participantes
    FOR UPDATE USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM itens_pedido ip
            JOIN pedidos p ON ip.pedido_id = p.id
            WHERE ip.id = item_pedido_id 
            AND p.user_id = auth.uid()
            AND p.status = 'pendente'
        )
    );

-- Política: Usuários podem deletar participantes de pedidos pendentes
CREATE POLICY "Users can delete own pending participants" ON participantes
    FOR DELETE USING (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM itens_pedido ip
            JOIN pedidos p ON ip.pedido_id = p.id
            WHERE ip.id = item_pedido_id 
            AND p.user_id = auth.uid()
            AND p.status = 'pendente'
        )
    );

-- Política: Administradores podem visualizar todos os participantes
CREATE POLICY "Admins can view all participants" ON participantes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Administradores podem atualizar todos os participantes
CREATE POLICY "Admins can update all participants" ON participantes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Líderes podem visualizar participantes da mesma igreja
CREATE POLICY "Leaders can view church participants" ON participantes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u1, users u2, itens_pedido ip, pedidos p
            WHERE u1.id = auth.uid() 
            AND u1.tipo = 'lider'
            AND ip.id = participantes.item_pedido_id
            AND p.id = ip.pedido_id
            AND u2.id = p.user_id
            AND u1.igreja = u2.igreja
        )
    );

-- Função para validar se o tamanho do participante corresponde ao item do pedido
CREATE OR REPLACE FUNCTION validate_participante_tamanho()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM itens_pedido 
        WHERE id = NEW.item_pedido_id AND tamanho = NEW.tamanho
    ) THEN
        RAISE EXCEPTION 'O tamanho do participante deve corresponder ao tamanho do item do pedido';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validar tamanho do participante
CREATE TRIGGER validate_participante_tamanho_before_insert
    BEFORE INSERT ON participantes
    FOR EACH ROW
    EXECUTE FUNCTION validate_participante_tamanho();

CREATE TRIGGER validate_participante_tamanho_before_update
    BEFORE UPDATE ON participantes
    FOR EACH ROW
    EXECUTE FUNCTION validate_participante_tamanho();

-- Função para validar se não excede a quantidade de participantes por item
CREATE OR REPLACE FUNCTION validate_participantes_quantidade()
RETURNS TRIGGER AS $$
DECLARE
    max_quantidade INTEGER;
    current_count INTEGER;
BEGIN
    -- Buscar quantidade máxima permitida para este item
    SELECT quantidade INTO max_quantidade
    FROM itens_pedido 
    WHERE id = NEW.item_pedido_id;
    
    -- Contar participantes atuais (excluindo o que está sendo atualizado)
    SELECT COUNT(*) INTO current_count
    FROM participantes 
    WHERE item_pedido_id = NEW.item_pedido_id
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    -- Validar se não excede a quantidade
    IF current_count >= max_quantidade THEN
        RAISE EXCEPTION 'Número de participantes (%) excede a quantidade do item (%)', 
                       current_count + 1, max_quantidade;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validar quantidade de participantes
CREATE TRIGGER validate_participantes_quantidade_before_insert
    BEFORE INSERT ON participantes
    FOR EACH ROW
    EXECUTE FUNCTION validate_participantes_quantidade();

CREATE TRIGGER validate_participantes_quantidade_before_update
    BEFORE UPDATE ON participantes
    FOR EACH ROW
    EXECUTE FUNCTION validate_participantes_quantidade();

-- View para relatórios de participantes com dados completos
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
    ip.preco_unitario as item_preco
FROM participantes p
JOIN users u ON p.user_id = u.id
JOIN itens_pedido ip ON p.item_pedido_id = ip.id
JOIN pedidos ped ON ip.pedido_id = ped.id;

-- Conceder permissões na view
GRANT SELECT ON vw_participantes_completo TO authenticated;

-- Conceder permissões na tabela
GRANT SELECT ON participantes TO anon;
GRANT ALL PRIVILEGES ON participantes TO authenticated;

-- Comentários na tabela
COMMENT ON TABLE participantes IS 'Tabela de participantes/compradores das camisetas do UMADEPAR 2025';
COMMENT ON COLUMN participantes.nome IS 'Nome completo do participante que receberá a camiseta';
COMMENT ON COLUMN participantes.tamanho IS 'Tamanho da camiseta do participante (deve corresponder ao item do pedido)';
COMMENT ON COLUMN participantes.item_pedido_id IS 'Referência ao item do pedido (tamanho específico)';
COMMENT ON COLUMN participantes.user_id IS 'Referência ao usuário que fez o pedido (jovem ou líder)';
COMMENT ON COLUMN participantes.cidade IS 'Cidade do participante';
COMMENT ON COLUMN participantes.igreja IS 'Igreja do participante';
COMMENT ON COLUMN participantes.observacoes IS 'Observações adicionais sobre o participante';

COMMENT ON VIEW vw_participantes_completo IS 'View com dados completos dos participantes para relatórios administrativos';