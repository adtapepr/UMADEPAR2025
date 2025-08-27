-- Migration: 002_create_pedidos_table.sql
-- Description: Criar tabela de pedidos com tipos individual e grupo
-- Date: 2025-01-21

-- Criar tabela pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo_pedido VARCHAR(20) NOT NULL CHECK (tipo_pedido IN ('individual', 'grupo')),
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimização de consultas
CREATE INDEX idx_pedidos_user_id ON pedidos(user_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_tipo_pedido ON pedidos(tipo_pedido);
CREATE INDEX idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX idx_pedidos_valor_total ON pedidos(valor_total);

-- Habilitar Row Level Security
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar seus próprios pedidos
CREATE POLICY "Users can view own orders" ON pedidos
    FOR SELECT USING (user_id = auth.uid());

-- Política: Usuários podem criar seus próprios pedidos
CREATE POLICY "Users can create own orders" ON pedidos
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem atualizar seus próprios pedidos (apenas status pendente)
CREATE POLICY "Users can update own pending orders" ON pedidos
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND status = 'pendente'
    );

-- Política: Administradores podem visualizar todos os pedidos
CREATE POLICY "Admins can view all orders" ON pedidos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Administradores podem atualizar todos os pedidos
CREATE POLICY "Admins can update all orders" ON pedidos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Líderes podem visualizar pedidos de jovens da mesma igreja
CREATE POLICY "Leaders can view church orders" ON pedidos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u1, users u2
            WHERE u1.id = auth.uid() 
            AND u1.tipo = 'lider'
            AND u2.id = pedidos.user_id
            AND u1.igreja = u2.igreja
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_pedidos_updated_at 
    BEFORE UPDATE ON pedidos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Conceder permissões
GRANT SELECT ON pedidos TO anon;
GRANT ALL PRIVILEGES ON pedidos TO authenticated;

-- Comentários na tabela
COMMENT ON TABLE pedidos IS 'Tabela de pedidos do sistema UMADEPAR 2025';
COMMENT ON COLUMN pedidos.tipo_pedido IS 'Tipo do pedido: individual (jovem) ou grupo (líder)';
COMMENT ON COLUMN pedidos.valor_total IS 'Valor total do pedido em reais';
COMMENT ON COLUMN pedidos.status IS 'Status do pedido: pendente, pago ou cancelado';
COMMENT ON COLUMN pedidos.user_id IS 'ID do usuário que fez o pedido';
COMMENT ON COLUMN pedidos.observacoes IS 'Observações adicionais sobre o pedido';