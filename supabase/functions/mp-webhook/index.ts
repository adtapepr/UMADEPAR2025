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

interface WebhookNotification {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved?: string;
  payment_method_id: string;
  payment_type_id: string;
  collector_id?: number;
  operation_type?: string;
  installments?: number;
  issuer_id?: string;
  card?: {
    last_four_digits?: string;
    first_six_digits?: string;
  };
  fee_details?: Array<{
    type: string;
    amount: number;
  }>;
  transaction_details?: {
    net_received_amount?: number;
  };
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log('🔔 [mp-webhook] Webhook recebido:', {
    request_id: requestId,
    method: req.method,
    timestamp,
    headers: Object.fromEntries(req.headers.entries()),
    user_agent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 [mp-webhook] Respondendo a preflight CORS:', {
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
    return new Response('ok', { headers: corsHeaders });
  }

  // Só aceita requisições POST
  if (req.method !== 'POST') {
    console.error('❌ [mp-webhook] Método não permitido:', {
      request_id: requestId,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Configura o Supabase Admin Client com bypass de RLS
    const supabaseAdmin = createClient(
      'https://bwrgpdlxhudtyewlmscl.supabase.co',
      Deno.env.get('SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    );

    console.log('🔧 [mp-webhook] Supabase Admin Client configurado:', {
      request_id: requestId,
      timestamp: new Date().toISOString()
    });

    // Lê o corpo da notificação
    const notification: WebhookNotification = await req.json();
    
    console.log('📨 [mp-webhook] Notificação recebida:', {
      request_id: requestId,
      notification: {
        id: notification.id,
        type: notification.type,
        action: notification.action,
        live_mode: notification.live_mode,
        data_id: notification.data?.id
      },
      timestamp: new Date().toISOString()
    });

    // Verifica se é uma notificação de pagamento
    if (notification.type !== 'payment') {
      console.log('ℹ️ [mp-webhook] Tipo de notificação ignorado:', {
        request_id: requestId,
        notification_type: notification.type,
        notification_id: notification.id,
        timestamp: new Date().toISOString()
      });
      
      return new Response('OK', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Extrai o ID do pagamento
    const paymentId = notification.data.id;
    
    console.log('🔍 [mp-webhook] Processando notificação de pagamento:', {
      request_id: requestId,
      payment_id: paymentId,
      notification_id: notification.id,
      action: notification.action,
      timestamp: new Date().toISOString()
    });
    
    if (!paymentId) {
      console.error('❌ [mp-webhook] ID do pagamento não encontrado:', {
        request_id: requestId,
        notification,
        timestamp: new Date().toISOString()
      });
      
      return new Response('Payment ID not found', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verifica se é um ID de teste
    if (paymentId.startsWith('test_')) {
      console.log('🧪 [mp-webhook] Processando pagamento de teste:', {
        request_id: requestId,
        payment_id: paymentId,
        timestamp: new Date().toISOString()
      });
      
      return new Response('Test payment processed', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Busca os detalhes do pagamento na API do Mercado Pago
    console.log('🔍 [mp-webhook] Buscando detalhes do pagamento na API do MP:', {
      request_id: requestId,
      payment_id: paymentId,
      timestamp: new Date().toISOString()
    });
    
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error('❌ [mp-webhook] Erro ao buscar pagamento na API do MP:', {
        request_id: requestId,
        payment_id: paymentId,
        status: mpResponse.status,
        status_text: mpResponse.statusText,
        error_data: errorData,
        timestamp: new Date().toISOString()
      });
      
      return new Response('Error fetching payment', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const payment: MercadoPagoPayment = await mpResponse.json();
    
    console.log('✅ [mp-webhook] Detalhes do pagamento obtidos:', {
      request_id: requestId,
      payment: {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount,
        currency_id: payment.currency_id,
        payment_method_id: payment.payment_method_id,
        date_created: payment.date_created,
        date_approved: payment.date_approved
      },
      timestamp: new Date().toISOString()
    });

    // Verifica se o pagamento tem uma referência externa (nosso order ID)
    if (!payment.external_reference) {
      console.error('❌ [mp-webhook] Pagamento sem referência externa:', {
        request_id: requestId,
        payment_id: payment.id,
        payment_status: payment.status,
        timestamp: new Date().toISOString()
      });
      
      return new Response('No external reference', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('🔍 [mp-webhook] Buscando pedido no banco de dados:', {
      request_id: requestId,
      order_id: payment.external_reference,
      payment_id: payment.id,
      timestamp: new Date().toISOString()
    });

    // Busca o pedido no nosso banco de dados
    const { data: order, error: orderError } = await supabaseAdmin
      .from('pedidos')
      .select('id, status, valor_total')
      .eq('id', payment.external_reference)
      .single();

    if (orderError || !order) {
      console.error('❌ [mp-webhook] Pedido não encontrado no banco:', {
        request_id: requestId,
        order_id: payment.external_reference,
        payment_id: payment.id,
        error: orderError,
        timestamp: new Date().toISOString()
      });
      
      return new Response('Order not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log('✅ [mp-webhook] Pedido encontrado no banco:', {
      request_id: requestId,
      order: {
        id: order.id,
        status: order.status,
        valor_total: order.valor_total
      },
      payment_id: payment.id,
      timestamp: new Date().toISOString()
    });

    // Verifica se o valor do pagamento confere com o pedido
    const orderValue = parseFloat(order.valor_total.toString());
    
    console.log('🔍 [mp-webhook] Verificando valor do pagamento:', {
      request_id: requestId,
      order_id: payment.external_reference,
      payment_amount: payment.transaction_amount,
      order_amount: orderValue,
      difference: Math.abs(payment.transaction_amount - orderValue),
      timestamp: new Date().toISOString()
    });
    
    if (Math.abs(payment.transaction_amount - orderValue) > 0.01) {
      console.error('❌ [mp-webhook] Valor do pagamento não confere:', {
        request_id: requestId,
        order_id: payment.external_reference,
        payment_id: payment.id,
        payment_amount: payment.transaction_amount,
        order_amount: orderValue,
        difference: Math.abs(payment.transaction_amount - orderValue),
        timestamp: new Date().toISOString()
      });
      
      return new Response('Amount mismatch', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Atualiza o status do pedido baseado no status do pagamento
    let newStatus = order.status;
    
    console.log('🔄 [mp-webhook] Mapeando status do pagamento:', {
      request_id: requestId,
      order_id: payment.external_reference,
      payment_status: payment.status,
      current_order_status: order.status,
      timestamp: new Date().toISOString()
    });
    
    switch (payment.status) {
      case 'approved':
        newStatus = 'pago';
        break;
      case 'rejected':
      case 'cancelled':
        newStatus = 'cancelado';
        break;
      case 'pending':
      case 'in_process':
      case 'in_mediation':
        newStatus = 'pendente';
        break;
      default:
        console.log('⚠️ [mp-webhook] Status de pagamento não mapeado:', {
          request_id: requestId,
          order_id: payment.external_reference,
          payment_status: payment.status,
          timestamp: new Date().toISOString()
        });
        break;
    }

    console.log('📝 [mp-webhook] Status mapeado:', {
      request_id: requestId,
      order_id: payment.external_reference,
      old_status: order.status,
      new_status: newStatus,
      payment_status: payment.status,
      timestamp: new Date().toISOString()
    });

    // Atualiza o pedido no banco de dados com todos os dados detalhados
    console.log('💾 [mp-webhook] Atualizando pedido no banco de dados:', {
      request_id: requestId,
      order_id: payment.external_reference,
      update_data: {
        status: newStatus,
        mp_payment_id: payment.id,
        mp_status: payment.status,
        mp_transaction_amount: payment.transaction_amount,
        mp_payment_method_id: payment.payment_method_id,
        mp_date_approved: payment.date_approved
      },
      timestamp: new Date().toISOString()
    });
    
    // Calcular taxa total e valor líquido
    const totalFeeAmount = payment.fee_details?.reduce((total, fee) => total + fee.amount, 0) || 0;
    const netAmount = payment.transaction_details?.net_received_amount || (payment.transaction_amount - totalFeeAmount);
    
    const { error: updateError } = await supabaseAdmin
      .from('pedidos')
      .update({
        status: newStatus,
        mp_payment_id: payment.id,
        mp_status: payment.status,
        mp_transaction_amount: payment.transaction_amount,
        mp_currency_id: payment.currency_id,
        mp_payment_method_id: payment.payment_method_id,
        mp_payment_type_id: payment.payment_type_id,
        mp_date_created: payment.date_created,
        mp_date_approved: payment.date_approved,
        mp_status_detail: payment.status_detail,
        mp_external_reference: payment.external_reference,
        mp_collector_id: payment.collector_id,
        mp_operation_type: payment.operation_type,
        mp_installments: payment.installments,
        mp_issuer_id: payment.issuer_id,
        mp_card_last_four_digits: payment.card?.last_four_digits,
        mp_card_first_six_digits: payment.card?.first_six_digits,
        mp_fee_amount: totalFeeAmount,
        mp_net_amount: netAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.external_reference);

    if (updateError) {
      console.error('❌ [mp-webhook] Erro ao atualizar pedido no banco:', {
        request_id: requestId,
        order_id: payment.external_reference,
        payment_id: payment.id,
        error: updateError,
        timestamp: new Date().toISOString()
      });
      
      return new Response('Error updating order', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log('✅ [mp-webhook] Pedido atualizado com sucesso:', {
      request_id: requestId,
      order_id: payment.external_reference,
      payment_id: payment.id,
      old_status: order.status,
      new_status: newStatus,
      mp_status: payment.status,
      timestamp: new Date().toISOString()
    });

    // Retorna sucesso para o Mercado Pago
    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('💥 [mp-webhook] Erro crítico no webhook:', {
      request_id: requestId,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
    
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});