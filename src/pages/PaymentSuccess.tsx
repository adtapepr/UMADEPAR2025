import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { OrderService } from '../services/orderService';

interface Order {
  id: string;
  tipo_pedido: string;
  valor_total: number;
  status: string;
  observacoes?: string;
  created_at: string;
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!externalReference) {
        setError('Referência do pedido não encontrada');
        setLoading(false);
        return;
      }

      try {
        const orderData = await OrderService.getOrder(externalReference);
        setOrder(orderData);
      } catch (err) {
        console.error('Erro ao buscar detalhes do pedido:', err);
        setError('Erro ao carregar detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [externalReference]);

  // Redirecionamento automático após 5 segundos
  useEffect(() => {
    if (!loading && !error && order) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            navigate('/meus-pedidos');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, error, order, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] via-[#1a4b73] to-[#0f2b45] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#edbe66] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando detalhes do pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] via-[#1a4b73] to-[#0f2b45]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-[#edbe66]">
              UMADEPAR 2025
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {error ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Erro ao Processar</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link 
                to="/"
                className="inline-block bg-[#edbe66] text-[#0f2b45] font-bold py-3 px-8 rounded-full hover:brightness-110 transition-all duration-300"
              >
                Voltar ao Início
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento Aprovado!</h1>
              <p className="text-lg text-gray-600 mb-8">
                Seu pagamento foi processado com sucesso. Você receberá um e-mail de confirmação em breve.
              </p>

              {/* Order Details */}
              {order && (
                <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalhes do Pedido</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número do Pedido:</span>
                      <span className="font-semibold text-gray-800">#{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-semibold text-gray-800">
                        {order.tipo_pedido === 'individual' ? 'Compra Individual' : 'Compra em Grupo'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Total:</span>
                      <span className="font-bold text-xl text-[#edbe66]">R$ {order.valor_total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        Pago
                      </span>
                    </div>
                    {paymentId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID do Pagamento:</span>
                        <span className="font-mono text-sm text-gray-800">{paymentId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Próximos Passos</h3>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Você receberá um e-mail de confirmação com todos os detalhes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Sua camiseta será entregue no evento UMADEPAR 2025</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Guarde este número do pedido para referência futura</span>
                  </li>
                </ul>
              </div>

              {/* Countdown Notice */}
              <div className="bg-green-50 rounded-xl p-4 mb-6 text-center">
                <p className="text-green-700">
                  Redirecionando para Meus Pedidos em <span className="font-bold">{countdown}</span> segundos...
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/meus-pedidos"
                  className="bg-[#edbe66] text-[#0f2b45] font-bold py-3 px-8 rounded-full hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Ver Meus Pedidos
                </Link>
                <button 
                  onClick={() => window.print()}
                  className="bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded-full hover:bg-gray-300 transition-all duration-300"
                >
                  Imprimir Comprovante
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;