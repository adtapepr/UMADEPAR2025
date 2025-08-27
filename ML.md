1. Análise da Estrutura e Modificações Necessárias
Sua estrutura atual (React + Supabase) é ideal para isso. A chave da integração será o uso de Supabase Edge Functions para lidar com a comunicação segura com a API do Mercado Pago.

1.1. Backend (Supabase) - O Mais Importante
Você precisará fazer uma pequena, mas crucial, alteração na sua tabela de pedidos para armazenar informações da transação.

Análise da Migração (pedidos table):

Sua tabela pedidos atual é um ótimo ponto de partida. Vamos adicionar campos para vincular um pedido do seu sistema a uma transação do Mercado Pago.

SQL

-- Sua tabela atual (resumida)
CREATE TABLE pedidos (
    id UUID PRIMARY KEY,
    user_id UUID,
    valor_total DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pendente',
    -- ... outros campos
);

-- ADIÇÕES NECESSÁRIAS
ALTER TABLE public.pedidos
ADD COLUMN mp_preference_id TEXT, -- Para armazenar o ID da preferência de pagamento
ADD COLUMN mp_payment_id BIGINT,  -- Para armazenar o ID do pagamento após aprovação
ADD COLUMN mp_status VARCHAR(50); -- Para armazenar o status exato retornado pelo MP
Por que esses campos?

mp_preference_id: Quando você cria uma "intenção de pagamento" no Mercado Pago, ele gera um ID de preferência. Guardar isso é útil para depuração e para garantir que cada pedido tenha uma única preferência.

mp_payment_id: Após o pagamento ser aprovado, o webhook do Mercado Pago nos informará o ID do pagamento. Armazenar isso é a confirmação final da transação.

mp_status: O Mercado Pago tem vários status (approved, in_process, rejected). Guardar o status original pode ser útil, enquanto o seu campo status (pago, pendente, cancelado) serve para a lógica interna do seu app.

1.2. Lógica no Servidor (Supabase Edge Functions)
Esta é a parte mais crítica. Toda a comunicação que envolve suas credenciais (chaves secretas) do Mercado Pago DEVE acontecer no servidor. As Edge Functions do Supabase são perfeitas para isso.

Você precisará de duas funções principais:

create-preference:

O que faz? Recebe os dados do pedido do seu frontend, se comunica com a API do Mercado Pago para criar a preferência de pagamento e retorna a URL de checkout para o cliente.

Segurança: Esta função buscará o preço e os itens do seu banco de dados, usando o ID do pedido. Isso impede que um usuário mal-intencionado altere o preço do produto no frontend antes de enviar para pagamento.

mp-webhook:

O que faz? É um endpoint que o Mercado Pago chamará sempre que o status de um pagamento mudar (ex: de pendente para aprovado).

Função: Ao receber uma notificação de pagamento aprovado, esta função irá consultar a API do Mercado Pago para confirmar os detalhes e, em seguida, atualizar o status do pedido no seu banco de dados para 'pago'.

1.3. Frontend (React)
Páginas de Venda (VendaIndividual.jsx, VendaGrupo.jsx): O botão "Finalizar Pedido" não irá mais apenas para o carrinho. Ele irá:

Criar um pedido no seu banco de dados com status 'pendente'.

Chamar a Edge Function create-preference, enviando o ID do pedido recém-criado.

Receber a URL de checkout (init_point) do Mercado Pago.

Redirecionar o usuário para essa URL.

Novas Páginas de Retorno: Você precisará criar páginas para onde o usuário será redirecionado após o pagamento.

/pedido/sucesso: Para pagamentos aprovados.

/pedido/pendente: Para pagamentos pendentes (ex: boleto).

/pedido/falha: Para pagamentos recusados.

2. O Fluxo de Integração Passo a Passo
Vamos detalhar o fluxo que você descreveu com a parte técnica:

Configuração Inicial:

Crie sua conta no Mercado Pago Desenvolvedores.

Pegue suas credenciais (ACCESS_TOKEN).

Adicione seu ACCESS_TOKEN como uma variável de ambiente segura no Supabase: MP_ACCESS_TOKEN.

Instale a SDK do Mercado Pago na sua Edge Function: npm install mercadopago.

Passo 1: Cliente Inicia o Processo (React)

O usuário clica em "Finalizar Compra".

Sua aplicação primeiro chama o orderService.js para criar o pedido na tabela pedidos com status: 'pendente'. Isso gera um pedido_id.

Em seguida, sua aplicação chama a Edge Function create-preference, passando o pedido_id.

JavaScript

// Exemplo no seu componente React
const handleFinalizeOrder = async () => {
    // 1. Cria o pedido no seu banco de dados
    const { data: newOrder, error } = await supabase
        .from('pedidos')
        .insert({ user_id: userId, valor_total: total, status: 'pendente' })
        .select()
        .single();

    if (error) { /* Tratar erro */ }

    // 2. Chama a Edge Function para criar a preferência de pagamento
    const { data: preference, error: funcError } = await supabase.functions.invoke(
        'create-preference',
        { body: { orderId: newOrder.id } }
    );

    if (funcError) { /* Tratar erro */ }

    // 3. Redireciona para o checkout do Mercado Pago
    if (preference.init_point) {
        window.location.href = preference.init_point;
    }
};
Passo 2: Servidor Cria a Preferência (Edge Function create-preference)

A função recebe o orderId.

Ela usa a chave de service_role do Supabase para buscar os detalhes desse pedido no banco (garantindo que o preço é o correto).

Ela monta o objeto preference com os dados do pedido, o valor_total, e as URLs de retorno (back_urls) e notificação (notification_url).

Ela envia isso para a API do Mercado Pago.

Ela salva o preference.id recebido na sua tabela pedidos.

Ela retorna o preference.init_point para o frontend.

Passo 3: Usuário Paga e Retorna

O usuário completa o pagamento no ambiente seguro do Mercado Pago.

O Mercado Pago o redireciona para uma das suas back_urls (ex: https://umadepar2025.com.br/pedido/sucesso). Essa página apenas mostra uma mensagem de status ao usuário. A confirmação real do pagamento vem no próximo passo.

Passo 4: A Magia do Webhook (Edge Function mp-webhook)

Esta é a parte mais crítica para a confirmação.

Quase simultaneamente ao passo 3, o Mercado Pago envia uma notificação POST para sua notification_url (ex: https://<seu-projeto>.supabase.co/functions/v1/mp-webhook).

Sua função mp-webhook recebe a notificação, que contém o ID do pagamento (data.id).

A função consulta a API do Mercado Pago para obter os detalhes completos desse pagamento.

Se o status do pagamento for approved, a função atualiza a sua tabela pedidos:

SET status = 'pago'

SET mp_payment_id = <id_do_pagamento>

SET mp_status = 'approved'

Sua função deve retornar um status 200 OK para o Mercado Pago saber que você recebeu a notificação.

3. Configurações Essenciais no Painel do Mercado Pago
No seu painel de desenvolvedor, você precisará configurar:

URL de Webhooks: Você deve registrar a URL da sua Edge Function mp-webhook. O Mercado Pago enviará notificações para lá.

Eventos: Configure o webhook para ouvir o evento payment.

4. Código de Exemplo (Simplificado) para Edge Functions
supabase/functions/create-preference/index.ts

TypeScript

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import mercadopago from "https://esm.sh/mercadopago@1.5.15";

serve(async (req) => {
  const { orderId } = await req.json();

  // Configura o Supabase Admin Client para buscar dados com segurança
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Busca os dados do pedido no seu banco para garantir o preço correto
  const { data: order, error } = await supabaseAdmin
    .from('pedidos')
    .select('id, valor_total')
    .eq('id', orderId)
    .single();

  if (error) throw error;

  // Configura o Mercado Pago SDK
  mercadopago.configure({ access_token: Deno.env.get('MP_ACCESS_TOKEN')! });

  const preference = {
    items: [{
      title: 'Inscrição UMADEPAR 2025',
      quantity: 1,
      currency_id: 'BRL',
      unit_price: order.valor_total,
    }],
    back_urls: {
      success: `${Deno.env.get('SITE_URL')}/pedido/sucesso`,
      pending: `${Deno.env.get('SITE_URL')}/pedido/pendente`,
      failure: `${Deno.env.get('SITE_URL')}/pedido/falha`,
    },
    notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
    external_reference: order.id, // Vincula a preferência ao seu ID de pedido
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    
    // Salva o preference_id no seu pedido
    await supabaseAdmin
      .from('pedidos')
      .update({ mp_preference_id: response.body.id })
      .eq('id', order.id);

    return new Response(JSON.stringify(response.body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
Este é um guia completo para você começar. A chave do sucesso é centralizar a lógica de pagamento e as chaves secretas nas Edge Functions, mantendo seu frontend responsável apenas por iniciar o processo e redirecionar o usuário.