-- Migration: 001_create_users_table.sql
-- Description: Criar tabela de usuários com tipos jovem, lider e admin
-- Date: 2025-01-21

-- Criar tabela users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'jovem' CHECK (tipo IN ('jovem', 'lider', 'admin')),
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    igreja VARCHAR(255),
    lider VARCHAR(255),
    pastor VARCHAR(255),
    foto_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimização de consultas
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tipo ON users(tipo);
CREATE INDEX idx_users_cidade ON users(cidade);
CREATE INDEX idx_users_igreja ON users(igreja);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem visualizar seu próprio perfil
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Política: Usuários podem inserir seu próprio perfil (registro)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política: Administradores podem visualizar todos os usuários
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Administradores podem atualizar todos os usuários
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tipo = 'admin'
        )
    );

-- Política: Líderes podem visualizar jovens da mesma igreja
CREATE POLICY "Leaders can view church members" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() 
            AND u.tipo = 'lider' 
            AND u.igreja = users.igreja
        )
    );

-- Conceder permissões
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Comentários na tabela
COMMENT ON TABLE users IS 'Tabela de usuários do sistema UMADEPAR 2025';
COMMENT ON COLUMN users.tipo IS 'Tipo de usuário: jovem, lider ou admin';
COMMENT ON COLUMN users.email IS 'Email único do usuário para autenticação';
COMMENT ON COLUMN users.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN users.igreja IS 'Nome da igreja do usuário';
COMMENT ON COLUMN users.lider IS 'Nome do líder responsável (para jovens)';
COMMENT ON COLUMN users.pastor IS 'Nome do pastor da igreja';