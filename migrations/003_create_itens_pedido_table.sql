-- Migration: 003_create_itens_pedido_table.sql
-- Description: Criar tabela de itens do pedido com tamanhos e preços
-- Date: 2025-01-21

-- Criar tabela itens_pedido
CREATE TABLE itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    tamanho VARCHAR(5) NOT NULL CHECK (tamanho IN ('P', 'M', 'G', 'GG', 'XG', 'XXG', 'E1', 'E2')),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL DEFAULT 79.90 CHECK (preco_unitario > 0),
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimização de consultas
CREATE INDEX idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_tamanho ON itens_pedido(tamanho);
CREATE INDEX idx_itens_pedido_quantidade ON itens_pedido(quantidade);
CREATE INDEX idx_itens_pedido_preco ON itens_pedido(preco_unitario);
CREATE INDEX idx_itens_pedido_created_at ON itens_pedido(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar itens de seus próprios pedidos
CREATE POLICY "Users can view own order items" ON itens_pedido
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE id = pedido_id AND user_id = auth.uid()
        )
    );

-- Política: Usuários podem inserir itens em seus próprios pedidos
CREATE POLICY "Users can insert own order items" ON itens_pedido
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE id = pedido_id AND user_id = auth.uid()
        )
    );

-- Política: Usuários podem atualizar itens de pedidos pendentes
CREATE POLICY "Users can update pending order items" ON itens_pedido
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE id = pedido_id 
            AND user_id = auth.uid() 
            AND status = 'pendente'
        )
    );

-- Política: Usuários podem deletar itens de pedidos pendentes
CREATE POLICY "Users can delete pending order items" ON itens_pedido
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE id = pedido_id 
            AND user_id = auth.uid() 
            AND status = 'pendente'
        )
    );

-- Política: Administradores podem visualizar todos os itens
CREATE POLICY "Admins can view all order items" ON itens_pedido
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Administradores podem atualizar todos os itens
CREATE POLICY "Admins can update all order items" ON itens_pedido
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Líderes podem visualizar itens de pedidos da mesma igreja
CREATE POLICY "Leaders can view church order items" ON itens_pedido
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u1, users u2, pedidos p
            WHERE u1.id = auth.uid() 
            AND u1.tipo = 'lider'
            AND p.id = itens_pedido.pedido_id
            AND u2.id = p.user_id
            AND u1.igreja = u2.igreja
        )
    );

-- Função para validar se o pedido ainda está pendente antes de modificar itens
CREATE OR REPLACE FUNCTION validate_pedido_status()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pedidos 
        WHERE id = NEW.pedido_id AND status != 'pendente'
    ) THEN
        RAISE EXCEPTION 'Não é possível modificar itens de pedidos que não estão pendentes';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validar status do pedido antes de inserir/atualizar itens
CREATE TRIGGER validate_pedido_status_before_insert
    BEFORE INSERT ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION validate_pedido_status();

CREATE TRIGGER validate_pedido_status_before_update
    BEFORE UPDATE ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION validate_pedido_status();

-- Função para atualizar valor total do pedido quando itens são modificados
CREATE OR REPLACE FUNCTION update_pedido_total()
RETURNS TRIGGER AS $$
DECLARE
    pedido_uuid UUID;
    novo_total DECIMAL(10,2);
BEGIN
    -- Determinar o pedido_id baseado na operação
    IF TG_OP = 'DELETE' THEN
        pedido_uuid := OLD.pedido_id;
    ELSE
        pedido_uuid := NEW.pedido_id;
    END IF;
    
    -- Calcular novo total
    SELECT COALESCE(SUM(subtotal), 0) INTO novo_total
    FROM itens_pedido 
    WHERE pedido_id = pedido_uuid;
    
    -- Atualizar valor total do pedido
    UPDATE pedidos 
    SET valor_total = novo_total,
        updated_at = NOW()
    WHERE id = pedido_uuid;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Triggers para atualizar valor total do pedido
CREATE TRIGGER update_pedido_total_after_insert
    AFTER INSERT ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION update_pedido_total();

CREATE TRIGGER update_pedido_total_after_update
    AFTER UPDATE ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION update_pedido_total();

CREATE TRIGGER update_pedido_total_after_delete
    AFTER DELETE ON itens_pedido
    FOR EACH ROW
    EXECUTE FUNCTION update_pedido_total();

-- Conceder permissões
GRANT SELECT ON itens_pedido TO anon;
GRANT ALL PRIVILEGES ON itens_pedido TO authenticated;

-- Comentários na tabela
COMMENT ON TABLE itens_pedido IS 'Tabela de itens dos pedidos (camisetas) do UMADEPAR 2025';
COMMENT ON COLUMN itens_pedido.tamanho IS 'Tamanho da camiseta: P, M, G, GG ou XG';
COMMENT ON COLUMN itens_pedido.quantidade IS 'Quantidade de camisetas deste tamanho';
COMMENT ON COLUMN itens_pedido.preco_unitario IS 'Preço unitário da camiseta (padrão R$ 79,90)';
COMMENT ON COLUMN itens_pedido.subtotal IS 'Subtotal calculado automaticamente (quantidade × preço_unitário)';
COMMENT ON COLUMN itens_pedido.pedido_id IS 'Referência ao pedido pai';