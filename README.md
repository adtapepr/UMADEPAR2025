# UMADEPAR 2025 - Sistema de Vendas

🎯 Sistema de vendas de camisetas para o evento UMADEPAR 2025, desenvolvido com React, TypeScript, Supabase e integração com Mercado Pago.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Pagamentos**: Mercado Pago API
- **Deploy**: Vercel
- **Monitoramento**: Sentry

## 📋 Funcionalidades

### 👥 Para Usuários
- ✅ Autenticação via Supabase Auth
- ✅ Compra individual de camisetas
- ✅ Compra em grupo (múltiplos participantes)
- ✅ Integração com Mercado Pago para pagamentos
- ✅ Acompanhamento de pedidos
- ✅ Geração de etiquetas para envio

### 🔧 Para Administradores
- ✅ Dashboard administrativo
- ✅ Gestão de pedidos
- ✅ Relatórios financeiros
- ✅ Controle de participantes
- ✅ Webhooks do Mercado Pago

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no Mercado Pago (credenciais de produção)
- Conta no Vercel (para deploy)

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Site Configuration
VITE_SITE_URL=https://seu-dominio.vercel.app

# Mercado Pago Configuration - PRODUÇÃO
VITE_MP_PUBLIC_KEY=APP_USR-sua_public_key_de_producao
MP_ACCESS_TOKEN=APP_USR-seu_access_token_de_producao

# Supabase Service Role Key (para Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Environment Configuration
VITE_ENVIRONMENT=production
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/adtapepr/UMADEPAR2025.git
cd UMADEPAR2025

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# Execute as migrações do banco
npx supabase db push

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🚀 Deploy

### Supabase Edge Functions

```bash
# Deploy das Edge Functions
npx supabase functions deploy create-preference
npx supabase functions deploy mp-webhook
```

### Vercel

```bash
# Deploy para produção
npx vercel --prod
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema
- `pedidos` - Pedidos realizados
- `itens_pedido` - Itens de cada pedido
- `participantes` - Participantes dos pedidos em grupo

### Views
- `payment_details_view` - Detalhes de pagamentos
- `financial_summary_view` - Resumo financeiro

## 🔧 Configuração do Mercado Pago

1. Acesse o [Painel do Desenvolvedor do Mercado Pago](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Obtenha as credenciais de **produção**:
   - Public Key (começa com `APP_USR-`)
   - Access Token (começa com `APP_USR-`)
4. Configure o webhook para: `https://seu-dominio.supabase.co/functions/v1/mp-webhook`

## 🐛 Troubleshooting

### Problema: URLs do Sandbox
Se o Mercado Pago estiver retornando URLs do sandbox mesmo com credenciais de produção:

1. Verifique se `VITE_ENVIRONMENT=production` está configurado
2. Confirme que as credenciais são de produção (começam com `APP_USR-`)
3. Verifique os logs no console do navegador

### Logs de Debug
O sistema inclui logs detalhados para debug:
- Variáveis de ambiente
- Respostas da API do Mercado Pago
- Status de produção vs sandbox

## 📝 Licença

Este projeto é privado e destinado exclusivamente ao evento UMADEPAR 2025.

## 👥 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte técnico, entre em contato através dos issues do GitHub ou pelo email do desenvolvedor.
