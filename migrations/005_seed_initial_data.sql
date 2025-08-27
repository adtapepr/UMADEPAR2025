-- Migration: 005_seed_initial_data.sql
-- Description: Configurações iniciais do sistema (sem dados fictícios)
-- Date: 2025-01-21

-- Criar função para gerar relatório de estatísticas
CREATE OR REPLACE FUNCTION get_umadepar_stats()
RETURNS TABLE (
    total_usuarios INTEGER,
    total_jovens INTEGER,
    total_lideres INTEGER,
    total_pedidos INTEGER,
    total_pedidos_pagos INTEGER,
    total_pedidos_pendentes INTEGER,
    total_participantes INTEGER,
    total_arrecadado DECIMAL(10,2),
    camisetas_vendidas INTEGER,
    cidades_participantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM users WHERE tipo != 'admin'),
        (SELECT COUNT(*)::INTEGER FROM users WHERE tipo = 'jovem'),
        (SELECT COUNT(*)::INTEGER FROM users WHERE tipo = 'lider'),
        (SELECT COUNT(*)::INTEGER FROM pedidos),
        (SELECT COUNT(*)::INTEGER FROM pedidos WHERE status = 'pago'),
        (SELECT COUNT(*)::INTEGER FROM pedidos WHERE status = 'pendente'),
        (SELECT COUNT(*)::INTEGER FROM participantes),
        (SELECT COALESCE(SUM(valor_total), 0) FROM pedidos WHERE status = 'pago'),
        (SELECT COALESCE(SUM(quantidade), 0)::INTEGER FROM itens_pedido ip JOIN pedidos p ON ip.pedido_id = p.id WHERE p.status = 'pago'),
        (SELECT COUNT(DISTINCT cidade)::INTEGER FROM participantes WHERE cidade IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Criar função para relatório por tamanho
CREATE OR REPLACE FUNCTION get_vendas_por_tamanho()
RETURNS TABLE (
    tamanho VARCHAR(5),
    quantidade_vendida INTEGER,
    receita_total DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ip.tamanho,
        SUM(ip.quantidade)::INTEGER as quantidade_vendida,
        SUM(ip.subtotal) as receita_total
    FROM itens_pedido ip
    JOIN pedidos p ON ip.pedido_id = p.id
    WHERE p.status = 'pago'
    GROUP BY ip.tamanho
    ORDER BY quantidade_vendida DESC;
END;
$$ LANGUAGE plpgsql;

-- Criar função para relatório por cidade
CREATE OR REPLACE FUNCTION get_vendas_por_cidade()
RETURNS TABLE (
    cidade VARCHAR(100),
    participantes INTEGER,
    receita_total DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(part.cidade, 'Não informado') as cidade,
        COUNT(part.id)::INTEGER as participantes,
        SUM(ip.preco_unitario) as receita_total
    FROM participantes part
    JOIN itens_pedido ip ON part.item_pedido_id = ip.id
    JOIN pedidos p ON ip.pedido_id = p.id
    WHERE p.status = 'pago'
    GROUP BY part.cidade
    ORDER BY participantes DESC;
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões nas funções
GRANT EXECUTE ON FUNCTION get_umadepar_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendas_por_tamanho() TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendas_por_cidade() TO authenticated;

-- Comentários nas funções
COMMENT ON FUNCTION get_umadepar_stats() IS 'Retorna estatísticas gerais do evento UMADEPAR 2025';
COMMENT ON FUNCTION get_vendas_por_tamanho() IS 'Retorna relatório de vendas agrupado por tamanho de camiseta';
COMMENT ON FUNCTION get_vendas_por_cidade() IS 'Retorna relatório de vendas agrupado por cidade dos participantes';

-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações iniciais
INSERT INTO configuracoes (chave, valor, descricao) VALUES
('preco_camiseta', '79.90', 'Preço unitário da camiseta do UMADEPAR 2025'),
('evento_nome', 'UMADEPAR 2025', 'Nome oficial do evento'),
('evento_data', '2025-07-15', 'Data do evento UMADEPAR 2025'),
('evento_local', 'Curitiba - PR', 'Local do evento'),
('vendas_ativas', 'true', 'Indica se as vendas estão ativas'),
('limite_pedido_grupo', '50', 'Limite máximo de camisetas por pedido em grupo'),
('limite_pedido_individual', '5', 'Limite máximo de camisetas por pedido individual')
ON CONFLICT (chave) DO NOTHING;

-- Habilitar RLS na tabela de configurações
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar configurações
CREATE POLICY "Everyone can view configurations" ON configuracoes
    FOR SELECT USING (true);

-- Política: Apenas admins podem modificar configurações
CREATE POLICY "Admins can modify configurations" ON configuracoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

GRANT SELECT ON configuracoes TO anon;
GRANT ALL PRIVILEGES ON configuracoes TO authenticated;

COMMENT ON TABLE configuracoes IS 'Tabela de configurações do sistema UMADEPAR 2025';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Configurações iniciais criadas com sucesso!';
    RAISE NOTICE 'Sistema pronto para receber dados reais de teste.';
    RAISE NOTICE 'Funções de relatório disponíveis: get_umadepar_stats(), get_vendas_por_tamanho(), get_vendas_por_cidade()';
END $$;