# Configuração do Mercado Pago - UMADEPAR 2025

## 🔑 Configuração das Chaves de Produção

Para configurar as novas chaves de produção do Mercado Pago no Supabase, siga os passos abaixo:

### 1. Acesso ao Painel do Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login na sua conta
3. Selecione o projeto **UMADEPAR 2025**

### 2. Configuração das Variáveis de Ambiente

1. No painel lateral esquerdo, clique em **Settings** (Configurações)
2. Clique em **Environment Variables** (Variáveis de Ambiente)
3. Configure as seguintes variáveis:

#### Variáveis Necessárias:

| Nome da Variável | Valor | Descrição |
|------------------|-------|----------|
| `MP_ACCESS_TOKEN` | `[SUA_CHAVE_PRIVADA_AQUI]` | Token de acesso do Mercado Pago (usado pelas Edge Functions) |
| `VITE_MP_PUBLIC_KEY` | `[SUA_CHAVE_PUBLICA_AQUI]` | Chave pública do Mercado Pago (usado pelo frontend) |

### 3. Como Adicionar/Editar Variáveis

1. **Para adicionar uma nova variável:**
   - Clique no botão **"Add variable"**
   - Digite o nome da variável (ex: `MP_ACCESS_TOKEN`)
   - Digite o valor correspondente
   - Clique em **"Add variable"**

2. **Para editar uma variável existente:**
   - Encontre a variável na lista
   - Clique no ícone de edição (lápis)
   - Altere o valor
   - Clique em **"Update variable"**

### 4. Reinicialização das Edge Functions

Após alterar as variáveis de ambiente:

1. Vá para **Edge Functions** no painel lateral
2. Para cada função (`create-preference` e `mp-webhook`):
   - Clique na função
   - Clique em **"Redeploy"** ou **"Deploy"**
   - Aguarde a reimplantação ser concluída

### 5. Verificação da Configuração

#### Teste Local (Desenvolvimento)
O arquivo `.env` local já foi atualizado com as novas chaves:

```env
VITE_MP_PUBLIC_KEY=[SUA_CHAVE_PUBLICA_AQUI]
MP_ACCESS_TOKEN=[SUA_CHAVE_PRIVADA_AQUI]
```

#### Teste em Produção
Para verificar se as configurações estão funcionando:

1. Faça um pedido de teste no ambiente de produção
2. Verifique se o redirecionamento para o Mercado Pago funciona
3. Complete um pagamento de teste
4. Confirme se o webhook está recebendo as notificações

### 6. Configuração no Painel do Mercado Pago

No painel do Mercado Pago, configure:

1. **URL do Webhook:**
   ```
   https://[SEU-PROJETO].supabase.co/functions/v1/mp-webhook
   ```

2. **Eventos a escutar:**
   - `payment` (pagamentos)

### 7. URLs de Redirecionamento

As URLs de redirecionamento já estão configuradas no código:

- **Sucesso:** `https://umadepar2025.com.br/pedido/sucesso`
- **Pendente:** `https://umadepar2025.com.br/pedido/pendente`
- **Falha:** `https://umadepar2025.com.br/pedido/falha`

### 8. Segurança

🔒 **MEDIDAS DE SEGURANÇA IMPLEMENTADAS:**

#### Proteção de Chaves Secretas:
- ✅ Arquivo `.env` está no `.gitignore` (não será commitado)
- ✅ Chaves reais removidas da documentação
- ✅ Placeholders seguros no `.env.example`
- ✅ `MP_ACCESS_TOKEN` configurado apenas no Supabase (servidor)

#### Boas Práticas:
- 🚫 **NUNCA** commite o arquivo `.env` no Git
- 🚫 **NUNCA** compartilhe o `MP_ACCESS_TOKEN` publicamente
- 🚫 **NUNCA** coloque chaves secretas em documentação
- ✅ Use apenas variáveis de ambiente para chaves sensíveis
- ✅ O `VITE_MP_PUBLIC_KEY` pode ser usado no frontend (é público)
- ✅ Mantenha as chaves de produção separadas das de teste

#### Verificação de Segurança:
```bash
# Verificar se .env não está sendo rastreado pelo Git
git status --ignored

# Verificar se não há chaves expostas no código
grep -r "APP_USR-" . --exclude-dir=node_modules --exclude=".env"
```

### 9. Troubleshooting

#### Erro: "MP_ACCESS_TOKEN não encontrado"
- Verifique se a variável foi adicionada corretamente no Supabase
- Confirme se as Edge Functions foram reimplantadas

#### Erro: "Chave pública inválida"
- Verifique se o `VITE_MP_PUBLIC_KEY` está correto
- Confirme se a aplicação foi reimplantada após a alteração

#### Webhook não funciona
- Verifique se a URL do webhook está correta no painel do Mercado Pago
- Confirme se a função `mp-webhook` está ativa no Supabase
- Verifique os logs da Edge Function para erros

---

**Configuração realizada em:** $(date)
**Chaves de produção ativadas:** ✅
**Status:** Pronto para uso em produção