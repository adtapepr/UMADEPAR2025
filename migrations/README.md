# Migrações do Banco de Dados - UMADEPAR 2025

Este diretório contém todas as migrações necessárias para configurar o banco de dados do sistema UMADEPAR 2025 no Supabase.

## 📋 Visão Geral

O sistema utiliza PostgreSQL através do Supabase com Row Level Security (RLS) para controlar o acesso aos dados baseado nos tipos de usuário:

- **Visitantes (anon)**: Acesso apenas à página inicial (pública)
- **Jovens**: Podem fazer pedidos individuais e visualizar seus próprios dados
- **Líderes**: Podem fazer pedidos em grupo e visualizar dados da sua igreja
- **Administradores**: Acesso completo a todos os dados e funcionalidades

## 🗂️ Estrutura das Migrações

### 001_create_users_table.sql
- Cria a tabela `users` com tipos de usuário (jovem, lider, admin)
- Implementa RLS policies para controle de acesso
- Índices para otimização de consultas
- Políticas específicas para cada tipo de usuário

### 002_create_pedidos_table.sql
- Cria a tabela `pedidos` para pedidos individuais e em grupo
- Implementa triggers para atualização automática de timestamps
- RLS policies baseadas no proprietário do pedido
- Controle de status (pendente, pago, cancelado)

### 003_create_itens_pedido_table.sql
- Cria a tabela `itens_pedido` para itens das camisetas
- Cálculo automático de subtotais
- Validação de tamanhos (P, M, G, GG, XG)
- Triggers para atualizar valor total do pedido automaticamente

### 004_create_participantes_table.sql
- Cria a tabela `participantes` para dados dos compradores
- Validação de quantidade vs participantes
- View `vw_participantes_completo` para relatórios
- Controle de tamanhos correspondentes aos itens

### 005_seed_initial_data.sql
- Dados iniciais para teste e desenvolvimento
- Usuários de exemplo (admin, líderes, jovens)
- Pedidos e participantes de exemplo
- Funções para relatórios e estatísticas
- Tabela de configurações do sistema

## 🚀 Como Executar as Migrações

### Opção 1: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Execute as migrações na ordem:
   ```sql
   -- Cole e execute o conteúdo de cada arquivo na ordem:
   -- 001_create_users_table.sql
   -- 002_create_pedidos_table.sql
   -- 003_create_itens_pedido_table.sql
   -- 004_create_participantes_table.sql
   -- 005_seed_initial_data.sql
   ```

### Opção 2: Via Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Executar migrações
supabase db push
```

### Opção 3: Via psql (Conexão Direta)

```bash
# Conectar ao banco
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Executar cada migração
\i 001_create_users_table.sql
\i 002_create_pedidos_table.sql
\i 003_create_itens_pedido_table.sql
\i 004_create_participantes_table.sql
\i 005_seed_initial_data.sql
```

## 🔐 Configuração de Autenticação

Após executar as migrações, configure a autenticação no Supabase:

1. **Authentication > Settings**:
   - Habilite "Enable email confirmations"
   - Configure "Site URL" para seu domínio
   - Adicione URLs de redirecionamento

2. **Authentication > Providers**:
   - Configure provedores desejados (Email, Google, etc.)

3. **Database > Authentication**:
   - Verifique se as policies RLS estão ativas
   - Teste o acesso com diferentes tipos de usuário



## 📊 Funções de Relatório

O sistema inclui funções SQL para relatórios:

```sql
-- Estatísticas gerais
SELECT * FROM get_umadepar_stats();

-- Vendas por tamanho
SELECT * FROM get_vendas_por_tamanho();

-- Vendas por cidade
SELECT * FROM get_vendas_por_cidade();

-- View completa de participantes
SELECT * FROM vw_participantes_completo;
```

## 🔧 Configurações do Sistema

As configurações são armazenadas na tabela `configuracoes`:

```sql
-- Visualizar configurações
SELECT * FROM configuracoes;

-- Atualizar preço da camiseta (apenas admin)
UPDATE configuracoes 
SET valor = '89.90' 
WHERE chave = 'preco_camiseta';
```

## 🛡️ Segurança (RLS Policies)

### Princípios de Segurança Implementados:

1. **Isolamento por Usuário**: Cada usuário só acessa seus próprios dados
2. **Hierarquia de Acesso**: Líderes veem dados da igreja, admins veem tudo
3. **Controle de Estado**: Apenas pedidos pendentes podem ser modificados
4. **Validação de Dados**: Triggers garantem consistência dos dados
5. **Acesso Público Limitado**: Apenas a home é acessível sem login

### Políticas por Tabela:

- **users**: Auto-acesso + hierarquia (líder → jovens da igreja, admin → todos)
- **pedidos**: Proprietário + hierarquia + controle de status
- **itens_pedido**: Baseado no proprietário do pedido + validações
- **participantes**: Baseado no proprietário + validação de quantidades
- **configuracoes**: Leitura pública + modificação apenas admin

## 🚨 Troubleshooting

### Erro: "relation does not exist"
- Verifique se executou as migrações na ordem correta
- Confirme se está conectado ao banco correto

### Erro: "permission denied for table"
- Verifique se o RLS está configurado corretamente
- Confirme se o usuário tem o tipo correto

### Erro: "violates check constraint"
- Verifique se os dados estão no formato correto
- Confirme os valores permitidos (ex: tamanhos, tipos)

### Performance Issues
- Verifique se os índices foram criados
- Analise queries com `EXPLAIN ANALYZE`
- Considere adicionar índices específicos se necessário

## 📝 Próximos Passos

1. Execute as migrações no seu projeto Supabase
2. Configure as variáveis de ambiente no frontend
3. Teste a autenticação com os usuários de exemplo
4. Implemente as funcionalidades do frontend
5. Configure o deploy e monitoramento

---

**Desenvolvido para UMADEPAR 2025** 🙏

*Para dúvidas ou suporte, consulte a documentação técnica completa.*