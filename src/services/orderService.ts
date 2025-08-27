import { createClient } from '@supabase/supabase-js';
import { captureError, captureMessage, addBreadcrumb, setContext } from '../lib/sentry';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos
export interface OrderItem {
  tamanho: string;
  quantidade: number;
  preco_unitario: number;
}

export interface CreateOrderData {
  tipo_pedido: 'individual' | 'grupo';
  valor_total: number;
  observacoes?: string;
  itens?: OrderItem[];
}

export interface Participante {
  nome: string;
  tamanho: string;
  telefone?: string;
  cidade?: string;
  igreja?: string;
}

export interface GroupOrderData {
  tipo_pedido: 'grupo';
  valor_total: number;
  itens: OrderItem[];
  participantes: Participante[];
}

export interface Order {
  id: string;
  user_id: string;
  tipo_pedido: 'individual' | 'grupo';
  valor_total: number;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  mp_preference_id?: string;
  mp_payment_id?: number;
  mp_status?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  mp_transaction_amount?: number;
  mp_currency_id?: string;
  mp_payment_method_id?: string;
  mp_payment_type_id?: string;
  mp_date_created?: string;
  mp_date_approved?: string;
  mp_status_detail?: string;
  mp_external_reference?: string;
  mp_collector_id?: number;
  mp_operation_type?: string;
  mp_installments?: number;
  mp_issuer_id?: number;
  mp_card_last_four_digits?: string;
  mp_card_first_six_digits?: string;
  mp_fee_amount?: number;
  mp_net_amount?: number;
  itens?: OrderItem[];
  participantes?: Participante[];
  itens_pedido?: (OrderItem & { participantes?: Participante[] })[];
}

// Serviço de Pedidos
export class OrderService {
  /**
   * Cria um novo pedido no banco de dados
   */
  static async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Adiciona contexto ao Sentry
    setContext('order_creation', {
      tipo_pedido: orderData.tipo_pedido,
      valor_total: orderData.valor_total,
      itens_count: orderData.itens?.length || 0
    });

    // Adiciona breadcrumb
    addBreadcrumb({
      category: 'order',
      message: 'Iniciando criação de pedido',
      level: 'info',
      data: orderData
    });

    console.log('🛒 [OrderService] Iniciando criação de pedido:', {
      tipo_pedido: orderData.tipo_pedido,
      valor_total: orderData.valor_total,
      itens_count: orderData.itens?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Verifica se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorMsg = authError ? authError.message : 'Sessão expirada';
      
      captureError(authError || new Error('User not found'), {
        context: 'order_creation_auth',
        orderData,
        timestamp: new Date().toISOString()
      });
      
      console.error('❌ [OrderService] Erro de autenticação:', {
        error: authError || 'User not found',
        code: errorMsg,
        timestamp: new Date().toISOString()
      });
      
      throw new Error(`Sessão expirada. Por favor, faça login novamente.`);
    }

    console.log('✅ [OrderService] Usuário autenticado:', {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // Cria o pedido
    const { data: order, error } = await supabase
      .from('pedidos')
      .insert({
        user_id: user.id,
        tipo_pedido: orderData.tipo_pedido,
        valor_total: orderData.valor_total,
        status: 'pendente',
        observacoes: orderData.observacoes,
      })
      .select()
      .single();

    if (error) {
      captureError(new Error(`Erro ao criar pedido: ${error.message}`), {
        context: 'order_creation_database',
        supabaseError: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        },
        orderData,
        timestamp: new Date().toISOString()
      });
      
      console.error('❌ [OrderService] Erro ao criar pedido no banco:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        orderData: orderData,
        timestamp: new Date().toISOString()
      });
      throw new Error('Erro ao criar pedido: ' + error.message);
    }

    // Adiciona breadcrumb de sucesso
    addBreadcrumb({
      category: 'order',
      message: 'Pedido criado com sucesso',
      level: 'info',
      data: {
        order_id: order.id,
        user_id: order.user_id,
        valor_total: order.valor_total
      }
    });

    console.log('✅ [OrderService] Pedido criado com sucesso:', {
      order_id: order.id,
      user_id: order.user_id,
      valor_total: order.valor_total,
      timestamp: new Date().toISOString()
    });

    // Se há itens, cria os registros na tabela itens_pedido
    if (orderData.itens && orderData.itens.length > 0) {
      console.log('📦 [OrderService] Criando itens do pedido:', {
        order_id: order.id,
        itens_count: orderData.itens.length,
        itens: orderData.itens,
        timestamp: new Date().toISOString()
      });

      const itensToInsert = orderData.itens.map(item => ({
        pedido_id: order.id,
        tamanho: item.tamanho,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensToInsert);

      if (itensError) {
        console.error('⚠️ [OrderService] Erro ao criar itens do pedido:', {
          error: itensError,
          code: itensError.code,
          message: itensError.message,
          order_id: order.id,
          itens: itensToInsert,
          timestamp: new Date().toISOString()
        });
        // Não falha o pedido por causa dos itens, mas loga o erro
      } else {
        console.log('✅ [OrderService] Itens do pedido criados com sucesso:', {
          order_id: order.id,
          itens_count: itensToInsert.length,
          timestamp: new Date().toISOString()
        });
      }
    }

    return order;
  }

  /**
   * Cria uma preferência de pagamento no Mercado Pago
   */
  static async createPaymentPreference(orderId: string): Promise<{ init_point: string; sandbox_init_point: string }> {
    // Adiciona contexto ao Sentry
    setContext('payment_preference', {
      order_id: orderId
    });

    // Adiciona breadcrumb
    addBreadcrumb({
      category: 'payment',
      message: 'Iniciando criação de preferência de pagamento',
      level: 'info',
      data: { order_id: orderId }
    });

    console.log('💳 [OrderService] Iniciando criação de preferência de pagamento:', {
      order_id: orderId,
      timestamp: new Date().toISOString()
    });

    try {
      const { data, error } = await supabase.functions.invoke('create-preference', {
        body: { orderId }
      });

      if (error) {
        captureError(error, {
          context: 'payment_preference_edge_function',
          order_id: orderId,
          error_message: error.message,
          timestamp: new Date().toISOString()
        });
        
        console.error('❌ [OrderService] Erro na Edge Function create-preference:', {
          error: error,
          message: error.message,
          order_id: orderId,
          timestamp: new Date().toISOString()
        });
        throw new Error('Erro ao criar preferência de pagamento: ' + error.message);
      }

      if (!data) {
        captureMessage('Resposta vazia da Edge Function create-preference', 'error', {
          context: 'payment_preference_empty_response',
          order_id: orderId,
          timestamp: new Date().toISOString()
        });
        
        console.error('❌ [OrderService] Resposta vazia da Edge Function:', {
          order_id: orderId,
          timestamp: new Date().toISOString()
        });
        throw new Error('Resposta vazia da API de pagamento');
      }

      if (!data.init_point) {
        captureMessage('init_point não encontrado na resposta', 'error', {
          context: 'payment_preference_no_init_point',
          order_id: orderId,
          response_data: data,
          timestamp: new Date().toISOString()
        });
        
        console.error('❌ [OrderService] init_point não encontrado na resposta:', {
          order_id: orderId,
          response_data: data,
          timestamp: new Date().toISOString()
        });
        throw new Error('URL de pagamento não encontrada na resposta');
      }

      // Adiciona breadcrumb de sucesso
      addBreadcrumb({
        category: 'payment',
        message: 'Preferência de pagamento criada com sucesso',
        level: 'info',
        data: {
          order_id: orderId,
          has_init_point: !!data.init_point,
          has_sandbox_init_point: !!data.sandbox_init_point
        }
      });

      console.log('✅ [OrderService] Preferência de pagamento criada com sucesso:', {
        order_id: orderId,
        has_init_point: !!data.init_point,
        has_sandbox_init_point: !!data.sandbox_init_point,
        timestamp: new Date().toISOString()
      });

      return {
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point || data.init_point
      };
    } catch (error) {
      captureError(error instanceof Error ? error : new Error('Erro desconhecido ao criar preferência'), {
        context: 'payment_preference_general_error',
        order_id: orderId,
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      });
      
      console.error('❌ [OrderService] Erro geral ao criar preferência:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        order_id: orderId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Busca um pedido pelo ID
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    console.log('🔍 [OrderService] Buscando pedido:', {
      order_id: orderId,
      timestamp: new Date().toISOString()
    });

    const { data: order, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ [OrderService] Erro ao buscar pedido:', {
        error: error,
        code: error.code,
        message: error.message,
        order_id: orderId,
        timestamp: new Date().toISOString()
      });
      return null;
    }

    if (order) {
      console.log('✅ [OrderService] Pedido encontrado:', {
        order_id: order.id,
        status: order.status,
        valor_total: order.valor_total,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ [OrderService] Pedido não encontrado:', {
        order_id: orderId,
        timestamp: new Date().toISOString()
      });
    }

    return order;
  }

  /**
   * Busca pedidos do usuário atual
   */
  static async getUserOrders(): Promise<Order[]> {
    console.log('📋 [OrderService] Buscando pedidos do usuário:', {
      timestamp: new Date().toISOString()
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ [OrderService] Erro de autenticação ao buscar pedidos:', {
        error: authError,
        message: authError.message,
        timestamp: new Date().toISOString()
      });
      throw new Error('Erro de autenticação: ' + authError.message);
    }

    if (!user) {
      console.error('❌ [OrderService] Usuário não encontrado ao buscar pedidos:', {
        timestamp: new Date().toISOString()
      });
      throw new Error('Usuário não autenticado');
    }

    console.log('✅ [OrderService] Usuário autenticado para busca de pedidos:', {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });

    const { data: orders, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [OrderService] Erro ao buscar pedidos do usuário:', {
        error: error,
        code: error.code,
        message: error.message,
        user_id: user.id,
        timestamp: new Date().toISOString()
      });
      throw new Error('Erro ao buscar pedidos: ' + error.message);
    }

    console.log('✅ [OrderService] Pedidos do usuário encontrados:', {
      user_id: user.id,
      orders_count: orders?.length || 0,
      timestamp: new Date().toISOString()
    });

    return orders || [];
  }

  /**
   * Busca pedidos do usuário com detalhes completos (pagamento e participantes)
   */
  static async getUserOrdersWithDetails(): Promise<OrderWithDetails[]> {
    console.log('📋 [OrderService] Buscando pedidos detalhados do usuário:', {
      timestamp: new Date().toISOString()
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorMsg = authError ? authError.message : 'Usuário não encontrado';
      console.error('❌ [OrderService] Erro de autenticação ao buscar pedidos detalhados:', {
        error: authError || 'User not found',
        timestamp: new Date().toISOString()
      });
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Buscar pedidos com todos os campos de pagamento
    const { data: orders, error: ordersError } = await supabase
      .from('pedidos')
      .select(`
        *,
        itens_pedido (
          tamanho,
          quantidade,
          preco_unitario,
          participantes (
            nome,
            tamanho,
            telefone,
            cidade,
            igreja
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ [OrderService] Erro ao buscar pedidos detalhados:', {
        error: ordersError,
        code: ordersError.code,
        message: ordersError.message,
        user_id: user.id,
        timestamp: new Date().toISOString()
      });
      throw new Error('Erro ao buscar pedidos: ' + ordersError.message);
    }

    console.log('✅ [OrderService] Pedidos detalhados encontrados:', {
      user_id: user.id,
      orders_count: orders?.length || 0,
      timestamp: new Date().toISOString()
    });

    return orders || [];
  }

  /**
   * Fluxo completo: criar pedido e iniciar pagamento
   */
  /**
   * Cria um pedido em grupo usando RPC (transacional)
   */
  static async createGroupOrder(orderData: GroupOrderData): Promise<string> {
    console.log('🚀 [OrderService] Iniciando criação de pedido em grupo via RPC:', {
      tipo_pedido: orderData.tipo_pedido,
      valor_total: orderData.valor_total,
      itens_count: orderData.itens.length,
      participantes_count: orderData.participantes.length,
      timestamp: new Date().toISOString()
    });

    // Adiciona contexto ao Sentry
    setContext('group_order_creation', {
      tipo_pedido: orderData.tipo_pedido,
      valor_total: orderData.valor_total,
      itens_count: orderData.itens.length,
      participantes_count: orderData.participantes.length
    });

    // Adiciona breadcrumb
    addBreadcrumb({
      category: 'order',
      message: 'Iniciando criação de pedido em grupo',
      level: 'info',
      data: orderData
    });

    try {
      // Verifica se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        const errorMsg = authError ? authError.message : 'Sessão expirada';
        
        captureError(authError || new Error('User not found'), {
          context: 'group_order_creation_auth',
          orderData,
          timestamp: new Date().toISOString()
        });
        
        console.error('❌ [OrderService] Erro de autenticação:', {
          error: authError || 'User not found',
          code: errorMsg,
          timestamp: new Date().toISOString()
        });
        
        throw new Error(`Sessão expirada. Por favor, faça login novamente.`);
      }

      console.log('✅ [OrderService] Usuário autenticado:', {
        user_id: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // 1. Chama a função RPC para criar o pedido em grupo
      console.log('📝 [OrderService] Etapa 1: Chamando RPC create_group_order...');
      const { data: orderId, error: rpcError } = await supabase.rpc('create_group_order', {
        data: orderData
      });

      if (rpcError) {
        console.error('❌ [OrderService] Erro na RPC create_group_order:', {
          error: rpcError,
          message: rpcError.message,
          orderData: orderData,
          timestamp: new Date().toISOString()
        });
        
        captureError(rpcError, {
          context: 'group_order_rpc_error',
          orderData,
          timestamp: new Date().toISOString()
        });
        
        throw new Error(`Erro ao criar pedido em grupo: ${rpcError.message}`);
      }

      if (!orderId) {
        const error = new Error('ID do pedido não retornado pela RPC');
        captureError(error, {
          context: 'group_order_no_id',
          orderData,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      console.log('✅ [OrderService] Pedido em grupo criado com sucesso:', {
        order_id: orderId,
        timestamp: new Date().toISOString()
      });
      
      // 2. Cria a preferência de pagamento
      console.log('💳 [OrderService] Etapa 2: Criando preferência de pagamento...');
      const preference = await this.createPaymentPreference(orderId);
      
      // 3. Retorna a URL de pagamento
      const isProduction = import.meta.env.PROD;
      const paymentUrl = isProduction ? preference.init_point : preference.sandbox_init_point;
      
      console.log('✅ [OrderService] Fluxo de pedido em grupo concluído com sucesso:', {
        order_id: orderId,
        payment_url: paymentUrl,
        is_production: isProduction,
        timestamp: new Date().toISOString()
      });
      
      return paymentUrl;
      
    } catch (error) {
      console.error('❌ [OrderService] Erro no fluxo de pedido em grupo:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        orderData: orderData,
        timestamp: new Date().toISOString()
      });
      
      captureError(error instanceof Error ? error : new Error('Unknown error'), {
        context: 'group_order_flow_error',
        orderData,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  static async createOrderAndStartPayment(orderData: CreateOrderData): Promise<string> {
    console.log('🚀 [OrderService] Iniciando fluxo completo de pagamento:', {
      tipo_pedido: orderData.tipo_pedido,
      valor_total: orderData.valor_total,
      itens_count: orderData.itens?.length || 0,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Cria o pedido
      console.log('📝 [OrderService] Etapa 1: Criando pedido...');
      const order = await this.createOrder(orderData);
      
      // 2. Cria a preferência de pagamento
      console.log('💳 [OrderService] Etapa 2: Criando preferência de pagamento...');
      const preference = await this.createPaymentPreference(order.id);
      
      // 3. Retorna a URL de pagamento
      const isProduction = import.meta.env.PROD;
      const paymentUrl = isProduction ? preference.init_point : preference.sandbox_init_point;
      
      console.log('✅ [OrderService] Fluxo de pagamento concluído com sucesso:', {
        order_id: order.id,
        payment_url: paymentUrl,
        is_production: isProduction,
        timestamp: new Date().toISOString()
      });
      
      return paymentUrl;
      
    } catch (error) {
      console.error('❌ [OrderService] Erro no fluxo completo de pagamento:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        orderData: orderData,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

export default OrderService;