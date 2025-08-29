// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declarações de tipos para Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};
import { corsHeaders } from '../_shared/cors.ts';

interface CreatePreferenceRequest {
  orderId: string;
}

interface MercadoPagoPreference {
  items: Array<{
    id: string;
    title: string;
    description: string;
    category_id: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
  }>;
  payer: {
    name: string;
    surname: string;
    email?: string;
  };
  back_urls: {
    success: string;
    pending: string;
    failure: string;
  };
  notification_url: string;
  external_reference: string;
  auto_return: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log('🚀 [create-preference] Iniciando criação de preferência:', {
    request_id: requestId,
    method: req.method,
    timestamp,
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    const { orderId }: CreatePreferenceRequest = await req.json();

    console.log('📝 [create-preference] Dados recebidos:', {
      request_id: requestId,
      order_id: orderId,
      timestamp: new Date().toISOString()
    });

    if (!orderId) {
      console.error('❌ [create-preference] orderId não fornecido:', {
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ error: 'orderId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Configura o Supabase Admin Client para buscar dados com segurança
    const supabaseAdmin = createClient(
      'https://bwrgpdlxhudtyewlmscl.supabase.co',
      Deno.env.get('SERVICE_ROLE_KEY')!
    );

    console.log('🔍 [create-preference] Buscando dados do pedido:', {
      request_id: requestId,
      order_id: orderId,
      timestamp: new Date().toISOString()
    });

    // Busca os dados do pedido e usuário no banco para garantir o preço correto
    const { data: order, error: orderError } = await supabaseAdmin
      .from('pedidos')
      .select(`
        id, 
        valor_total, 
        tipo_pedido, 
        user_id,
        users!inner(
          nome,
          email
        )
      `)
      .eq('id', orderId)
      .eq('status', 'pendente')
      .single();

    if (orderError || !order) {
      console.error('❌ [create-preference] Pedido não encontrado:', {
        request_id: requestId,
        order_id: orderId,
        error: orderError,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado ou já processado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Busca os itens do pedido para criar items detalhados
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('itens_pedido')
      .select('id, tamanho, quantidade, preco_unitario')
      .eq('pedido_id', order.id);

    if (itemsError) {
      console.error('❌ [create-preference] Erro ao buscar itens do pedido:', {
        request_id: requestId,
        order_id: orderId,
        error: itemsError,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar itens do pedido' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extrair nome e sobrenome do usuário
    const nomeCompleto = order.users.nome.trim();
    const partesNome = nomeCompleto.split(' ');
    const firstName = partesNome[0] || 'Cliente';
    const lastName = partesNome.length > 1 ? partesNome.slice(1).join(' ') : 'UMADEPAR';

    console.log('✅ [create-preference] Pedido e dados encontrados:', {
      request_id: requestId,
      order: {
        id: order.id,
        valor_total: order.valor_total,
        tipo_pedido: order.tipo_pedido,
        user_id: order.user_id,
        user_name: order.users.nome,
        user_email: order.users.email
      },
      items_count: orderItems?.length || 0,
      payer: {
        name: firstName,
        surname: lastName
      },
      timestamp: new Date().toISOString()
    });

    // Mapear itens do pedido para o formato do Mercado Pago
    const items = (orderItems || []).map((item: any, index: number) => ({
      id: `umadepar_${item.id}`,
      title: `Camiseta UMADEPAR 2025 - Tamanho ${item.tamanho}`,
      description: `Camiseta oficial do evento UMADEPAR 2025, tamanho ${item.tamanho}. Pedido ${order.tipo_pedido === 'individual' ? 'individual' : 'em grupo'}.`,
      category_id: 'clothing',
      quantity: item.quantidade,
      currency_id: 'BRL',
      unit_price: parseFloat(item.preco_unitario.toString()),
    }));

    // Se não houver itens específicos, criar um item genérico
    if (items.length === 0) {
      items.push({
        id: `umadepar_${order.id}`,
        title: `Inscrição UMADEPAR 2025 - ${order.tipo_pedido === 'individual' ? 'Individual' : 'Grupo'}`,
        description: `Inscrição para o evento UMADEPAR 2025. Tipo de pedido: ${order.tipo_pedido}.`,
        category_id: 'services',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: parseFloat(order.valor_total.toString()),
      });
    }

    // Configura a preferência de pagamento com dados completos
    const preference: MercadoPagoPreference = {
      items,
      payer: {
        name: firstName,
        surname: lastName,
        email: order.users.email
      },
      back_urls: {
        success: `${Deno.env.get('SITE_URL')}/meus-pedidos`,
        pending: `${Deno.env.get('SITE_URL')}/meus-pedidos`,
        failure: `${Deno.env.get('SITE_URL')}/meus-pedidos`,
      },
      notification_url: `https://bwrgpdlxhudtyewlmscl.supabase.co/functions/v1/mp-webhook`,
      external_reference: order.id,
      auto_return: 'approved',
    };

    // Log das credenciais (mascaradas para segurança)
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    console.log('🔑 [create-preference] Verificando credenciais:', {
      request_id: requestId,
      order_id: orderId,
      mp_access_token_exists: !!mpAccessToken,
      mp_access_token_prefix: mpAccessToken ? mpAccessToken.substring(0, 8) + '...' : 'undefined',
      mp_access_token_length: mpAccessToken ? mpAccessToken.length : 0,
      timestamp: new Date().toISOString()
    });

    console.log('💳 [create-preference] Criando preferência no Mercado Pago:', {
      request_id: requestId,
      order_id: orderId,
      preference: {
        items_count: preference.items.length,
        items: preference.items.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        payer: {
          name: preference.payer.name,
          surname: preference.payer.surname,
          email: preference.payer.email
        },
        external_reference: preference.external_reference,
        back_urls: preference.back_urls,
        notification_url: preference.notification_url
      },
      timestamp: new Date().toISOString()
    });

    // Chama a API do Mercado Pago para criar a preferência
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    console.log('📡 [create-preference] Resposta da API do Mercado Pago:', {
      request_id: requestId,
      order_id: orderId,
      status: mpResponse.status,
      statusText: mpResponse.statusText,
      headers: Object.fromEntries(mpResponse.headers.entries()),
      timestamp: new Date().toISOString()
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      
      console.error('❌ [create-preference] Erro na API do Mercado Pago:', {
        request_id: requestId,
        order_id: orderId,
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        error_data: errorData,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar preferência de pagamento' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const mpPreference = await mpResponse.json();
    
    console.log('✅ [create-preference] Preferência criada no Mercado Pago:', {
      request_id: requestId,
      order_id: orderId,
      preference_id: mpPreference.id,
      init_point: mpPreference.init_point,
      sandbox_init_point: mpPreference.sandbox_init_point,
      full_response: mpPreference,
      timestamp: new Date().toISOString()
    });

    console.log('💾 [create-preference] Salvando preference_id no banco:', {
      request_id: requestId,
      order_id: orderId,
      preference_id: mpPreference.id,
      timestamp: new Date().toISOString()
    });

    // Salva o preference_id no pedido
    const { error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update({ mp_preference_id: mpPreference.id })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ [create-preference] Erro ao atualizar pedido:', {
        request_id: requestId,
        order_id: orderId,
        preference_id: mpPreference.id,
        error: updateError,
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar preferência no banco de dados' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🎉 [create-preference] Processo concluído com sucesso:', {
      request_id: requestId,
      order_id: orderId,
      preference_id: mpPreference.id,
      init_point: mpPreference.init_point,
      timestamp: new Date().toISOString()
    });

    // Retorna a preferência criada
    return new Response(
      JSON.stringify({
        id: mpPreference.id,
        init_point: mpPreference.init_point,
        sandbox_init_point: mpPreference.sandbox_init_point,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 [create-preference] Erro crítico na função:', {
      request_id: requestId,
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});