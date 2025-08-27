import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OrderService, OrderWithDetails } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import { Package, CreditCard, Users, Calendar, MapPin, Phone, User, CheckCircle, Clock, XCircle, AlertCircle, X, ArrowLeft } from 'lucide-react';

const MeusPedidos: React.FC = () => {
  const { userData } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await OrderService.getUserOrdersWithDetails();
      
      // Processar a estrutura aninhada dos participantes
      const processedOrders = ordersData.map(order => {
        const allParticipantes: any[] = [];
        
        if (order.itens_pedido) {
          order.itens_pedido.forEach((item: any) => {
            if (item.participantes) {
              allParticipantes.push(...item.participantes);
            }
          });
        }
        
        return {
          ...order,
          itens: order.itens_pedido || [],
          participantes: allParticipantes
        };
      });
      
      setOrders(processedOrders);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError('Erro ao carregar pedidos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-[#edbe66] text-[#0f2b45]';
      case 'pago':
        return 'bg-[#edbe66] text-[#0f2b45]';
      case 'cancelado':
        return 'bg-[#edbe66] text-[#0f2b45]';
      case 'processando':
        return 'bg-[#edbe66] text-[#0f2b45]';
      default:
        return 'bg-[#edbe66] text-[#0f2b45]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-4 h-4 text-white" />;
      case 'pago':
        return <CheckCircle className="w-4 h-4 text-white" />;
      case 'cancelado':
        return <XCircle className="w-4 h-4 text-white" />;
      case 'processando':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'pago':
        return 'Pago';
      case 'cancelado':
        return 'Cancelado';
      case 'processando':
        return 'Processando';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodText = (methodId: string) => {
    const methods: { [key: string]: string } = {
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'bank_transfer': 'Transferência Bancária'
    };
    return methods[methodId] || methodId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] via-[#1a365d] to-[#2d3748] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#edbe66] border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-semibold">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] via-[#1a365d] to-[#2d3748] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar pedidos</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-[#edbe66] text-[#0f2b45] font-bold py-3 px-6 rounded-full hover:brightness-110 transition-all duration-300"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f2b45]">
      <main className="container mx-auto px-4 py-8">
        <section className="mb-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Link
                to="/"
                className="flex items-center gap-2 text-white hover:text-[#edbe66] transition-colors duration-300 group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium">Voltar</span>
              </Link>
            </div>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Meus <span className="text-[#edbe66]">Pedidos</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Acompanhe o status dos seus pedidos e veja todos os detalhes
              </p>
            </div>
          </div>

          {/* Lista de Pedidos */}
          {orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#edbe66]/50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">
                        #{order.id.slice(-6).toUpperCase()}
                      </h3>
                      <p className="text-gray-400 text-xs">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(order.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Valor:</span>
                      <span className="font-bold text-[#edbe66] text-sm">
                        {formatCurrency(order.valor_total)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Tipo:</span>
                      <span className="text-white text-xs capitalize">{order.tipo_pedido}</span>
                    </div>
                    {order.tipo_pedido === 'grupo' && order.participantes && order.participantes.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs">Participantes:</span>
                        <span className="text-[#edbe66] text-xs font-bold">
                          {order.participantes.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Nenhum pedido encontrado</h2>
              <p className="text-gray-300 mb-6">Você ainda não fez nenhum pedido.</p>
              <Link
                to={userData?.tipo === 'lider' ? '/venda-lider' : '/venda-jovem'}
                className="bg-[#edbe66] text-[#0f2b45] font-bold py-3 px-6 rounded-full hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center"
              >
                <Package className="w-5 h-5 mr-2" />
                Fazer primeiro pedido
              </Link>
            </div>
          )}

          {/* Modal de Detalhes do Pedido */}
          {isModalOpen && selectedOrder && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-[#0f2b45] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Detalhes do Pedido #{selectedOrder.id.slice(-8).toUpperCase()}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Status e Informações Básicas */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">Status:</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedOrder.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">Tipo de Pedido:</span>
                    <span className="font-bold capitalize text-white">{selectedOrder.tipo_pedido}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">Valor Total:</span>
                    <span className="font-bold text-[#edbe66] text-xl">
                      {formatCurrency(selectedOrder.valor_total)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">Data do Pedido:</span>
                    <span className="font-bold text-white">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                </div>

                {/* Informações de Pagamento */}
                {selectedOrder.status === 'pago' && (
                  <div className="border-t border-[#edbe66]/30 pt-6 mb-6">
                    <h4 className="font-bold text-white mb-4 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-[#edbe66]" />
                      Informações de Pagamento
                    </h4>

                    <div className="space-y-3 text-sm">
                      {selectedOrder.mp_payment_method_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-semibold">Método:</span>
                          <span className="font-bold text-white">
                            {getPaymentMethodText(selectedOrder.mp_payment_method_id)}
                          </span>
                        </div>
                      )}
                      
                      {selectedOrder.mp_transaction_amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-semibold">Valor Pago:</span>
                          <span className="font-bold text-[#edbe66]">
                            {formatCurrency(selectedOrder.mp_transaction_amount)}
                          </span>
                        </div>
                      )}
                      
                      {selectedOrder.mp_date_approved && (
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-semibold">Data de Aprovação:</span>
                          <span className="font-bold text-white">
                            {formatDate(selectedOrder.mp_date_approved)}
                          </span>
                        </div>
                      )}
                      
                      {selectedOrder.mp_installments && selectedOrder.mp_installments > 1 && (
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-semibold">Parcelas:</span>
                          <span className="font-bold text-white">{selectedOrder.mp_installments}x</span>
                        </div>
                      )}
                      
                      {selectedOrder.mp_card_last_four_digits && (
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-semibold">Cartão:</span>
                          <span className="font-bold text-white">**** {selectedOrder.mp_card_last_four_digits}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Itens do Pedido */}
                {selectedOrder.itens && selectedOrder.itens.length > 0 && (
                  <div className="border-t border-[#edbe66]/30 pt-6 mb-6">
                    <h4 className="font-bold text-white mb-4">Itens do Pedido</h4>
                    <div className="space-y-3">
                      {selectedOrder.itens.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-[#edbe66]/10 last:border-b-0">
                          <div>
                            <span className="font-bold text-white">Tamanho {item.tamanho}</span>
                            <span className="text-gray-300 ml-2 font-semibold">x{item.quantidade}</span>
                          </div>
                          <span className="font-bold text-[#edbe66]">
                            {formatCurrency(item.preco_unitario * item.quantidade)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Participantes (apenas para líderes e pedidos em grupo) */}
                {userData?.tipo === 'lider' && selectedOrder.tipo_pedido === 'grupo' && selectedOrder.participantes && selectedOrder.participantes.length > 0 && (
                  <div className="border-t border-[#edbe66]/30 pt-6">
                    <h4 className="font-bold text-white mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-[#edbe66]" />
                      Participantes ({selectedOrder.participantes.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.participantes.map((participante, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg border border-[#edbe66]/20">
                          <span className="font-bold text-white">{participante.nome}</span>
                          <span className="text-sm bg-[#edbe66] text-[#0f2b45] px-2 py-1 rounded font-bold">
                            Tamanho {participante.tamanho}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {selectedOrder.observacoes && (
                  <div className="border-t border-[#edbe66]/30 pt-6 mt-6">
                    <h4 className="font-bold text-white mb-2">Observações</h4>
                    <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg border border-[#edbe66]/20">
                      {selectedOrder.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MeusPedidos;