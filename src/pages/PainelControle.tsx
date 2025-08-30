import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import CustomDropdown from '../components/CustomDropdown';

// Interfaces para as views do Supabase
interface ParticipanteCompleto {
  id: string;
  nome: string;
  tamanho: string;
  telefone?: string;
  cidade?: string;
  igreja?: string;
  observacoes?: string;
  created_at: string;
  comprador_nome: string;
  comprador_email: string;
  comprador_tipo: string;
  pedido_id: string;
  pedido_status: string;
  pedido_valor: number;
  item_quantidade: number;
  item_preco: number;
  valor_real_pago: number;
}

interface PaymentDetails {
  pedido_id: string;
  user_id: string;
  comprador_nome: string;
  comprador_email: string;
  tipo_pedido: string;
  valor_pedido_original: number;
  status_pedido: string;
  data_criacao_pedido: string;
  data_atualizacao_pedido: string;
  mp_preference_id?: string;
  mp_payment_id?: string;
  mp_status?: string;
  mp_status_detail?: string;
  mp_external_reference?: string;
  valor_pago_real?: number;
  moeda?: string;
  taxa_mp?: number;
  valor_liquido_recebido?: number;
  metodo_pagamento?: string;
  tipo_pagamento?: string;
  parcelas?: number;
  data_criacao_pagamento?: string;
  data_aprovacao_pagamento?: string;
  bin_cartao?: string;
  final_cartao?: string;
  banco_emissor?: string;
  mp_collector_id?: string;
  tipo_operacao?: string;
  metodo_pagamento_descricao?: string;
  status_pagamento_descricao?: string;
  diferenca_valor?: number;
  tempo_aprovacao_minutos?: number;
  tem_pagamento_mp?: boolean;
  pagamento_aprovado?: boolean;
  pagamento_parcelado?: boolean;
  pagamento_cartao?: boolean;
}

interface FinancialMetrics {
  totalArrecadado: number;
  taxasMercadoPago: number;
  valorLiquido: number;
  camisetasPagas: number;
  metodosPagamento: { [key: string]: { count: number; value: number } };
  pagamentosPorDia: { [key: string]: number };
  pagamentosPorMes: { [key: string]: number };
}

type TabType = 'financeiro' | 'participantes' | 'pedidos';

const PainelControle: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('financeiro');
  const [participantes, setParticipantes] = useState<ParticipanteCompleto[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Carregar dados das views
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar participantes completos
        const { data: participantesData, error: participantesError } = await supabase
          .from('vw_participantes_completo')
          .select('*')
          .order('created_at', { ascending: false });

        if (participantesError) {
          console.error('Erro ao buscar participantes:', participantesError);
          throw participantesError;
        }

        // Buscar detalhes de pagamento
        const { data: paymentData, error: paymentError } = await supabase
          .from('vw_payment_details')
          .select('*')
          .order('data_criacao_pedido', { ascending: false });

        if (paymentError) {
          console.error('Erro ao buscar detalhes de pagamento:', paymentError);
          throw paymentError;
        }

        setParticipantes(participantesData || []);
        setPaymentDetails(paymentData || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados do painel');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular métricas financeiras
  const financialMetrics = useMemo((): FinancialMetrics => {
    const pagos = paymentDetails.filter(p => p.pagamento_aprovado);
    
    const totalArrecadado = pagos.reduce((sum, p) => sum + (p.valor_pago_real || 0), 0);
    const taxasMercadoPago = pagos.reduce((sum, p) => sum + (p.taxa_mp || 0), 0);
    const valorLiquido = pagos.reduce((sum, p) => sum + (p.valor_liquido_recebido || 0), 0);
    
    // Contar camisetas pagas
    const camisetasPagas = participantes.filter(p => p.pedido_status === 'pago').length;
    
    // Métodos de pagamento
    const metodosPagamento: { [key: string]: { count: number; value: number } } = {};
    pagos.forEach(p => {
      const metodo = p.metodo_pagamento_descricao || 'Não informado';
      if (!metodosPagamento[metodo]) {
        metodosPagamento[metodo] = { count: 0, value: 0 };
      }
      metodosPagamento[metodo].count++;
      metodosPagamento[metodo].value += p.valor_pago_real || 0;
    });
    
    // Pagamentos por dia
    const pagamentosPorDia: { [key: string]: number } = {};
    pagos.forEach(p => {
      if (p.data_aprovacao_pagamento) {
        const date = new Date(p.data_aprovacao_pagamento).toISOString().split('T')[0];
        pagamentosPorDia[date] = (pagamentosPorDia[date] || 0) + (p.valor_pago_real || 0);
      }
    });
    
    // Pagamentos por mês
    const pagamentosPorMes: { [key: string]: number } = {};
    pagos.forEach(p => {
      if (p.data_aprovacao_pagamento) {
        const date = new Date(p.data_aprovacao_pagamento);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        pagamentosPorMes[monthKey] = (pagamentosPorMes[monthKey] || 0) + (p.valor_pago_real || 0);
      }
    });
    
    return {
      totalArrecadado,
      taxasMercadoPago,
      valorLiquido,
      camisetasPagas,
      metodosPagamento,
      pagamentosPorDia,
      pagamentosPorMes
    };
  }, [paymentDetails, participantes]);

  // Filtrar participantes pagos
  const participantesPagos = useMemo(() => {
    return participantes.filter(p => p.pedido_status === 'pago');
  }, [participantes]);

  // Filtrar pedidos com base nos filtros
  const pedidosFiltrados = useMemo(() => {
    let filtered = [...paymentDetails];
    
    // Filtro por data
    if (dateFilter !== 'all') {
      const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(p => 
        new Date(p.data_criacao_pedido) >= cutoffDate
      );
    }
    
    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status_pedido === statusFilter);
    }
    
    return filtered;
  }, [paymentDetails, dateFilter, statusFilter]);

  // Obter cidades únicas para o filtro
  const uniqueCities = useMemo(() => {
    const cities = new Set(participantes.map(p => p.cidade).filter(Boolean));
    return Array.from(cities).sort();
  }, [participantes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando painel de controle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
              <p className="text-gray-600 mt-1">Gestão completa do evento UMADEPAR 2025</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard-adm"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Dashboard Principal
              </Link>
              <div className="text-sm text-gray-500">
                Logado como: {user?.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'financeiro', label: 'Financeiro', icon: '💰' },
              { id: 'participantes', label: 'Participantes', icon: '👥' },
              { id: 'pedidos', label: 'Pedidos', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'financeiro' && (
          <FinanceiroTab metrics={financialMetrics} />
        )}
        
        {activeTab === 'participantes' && (
          <ParticipantesTab 
            participantes={participantesPagos}
            uniqueCities={uniqueCities}
            cityFilter={cityFilter}
            setCityFilter={setCityFilter}
          />
        )}
        
        {activeTab === 'pedidos' && (
          <PedidosTab 
            pedidos={pedidosFiltrados}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )}
      </div>
    </div>
  );
};

// Componente da aba Financeiro
const FinanceiroTab: React.FC<{ metrics: FinancialMetrics }> = ({ metrics }) => {
  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">R$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Arrecadado</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {metrics.totalArrecadado.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Taxas (MP)</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {metrics.taxasMercadoPago.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Valor Líquido</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {metrics.valorLiquido.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">👕</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Camisetas Pagas</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.camisetasPagas}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métodos de Pagamento */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Métodos de Pagamento</h3>
          <div className="space-y-3">
            {Object.entries(metrics.metodosPagamento).map(([metodo, data]) => (
              <div key={metodo} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{metodo}</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {data.count} pedidos
                  </div>
                  <div className="text-xs text-gray-500">
                    R$ {data.value.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendas por Mês */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vendas por Mês</h3>
          <div className="space-y-3">
            {Object.entries(metrics.pagamentosPorMes)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([mes, valor]) => {
                const [ano, mesNum] = mes.split('-');
                const mesNome = new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                return (
                  <div key={mes} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{mesNome}</span>
                    <span className="text-sm font-medium text-gray-900">
                      R$ {valor.toFixed(2)}
                    </span>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente da aba Participantes
const ParticipantesTab: React.FC<{
  participantes: ParticipanteCompleto[];
  uniqueCities: string[];
  cityFilter: string;
  setCityFilter: (city: string) => void;
}> = ({ participantes, uniqueCities, cityFilter, setCityFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string>('all');

  const filteredParticipantes = useMemo(() => {
    return participantes.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.comprador_nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === 'all' || p.cidade === cityFilter;
      const matchesSize = sizeFilter === 'all' || p.tamanho === sizeFilter;
      
      return matchesSearch && matchesCity && matchesSize;
    });
  }, [participantes, searchTerm, cityFilter, sizeFilter]);

  const uniqueSizes = useMemo(() => {
    const sizes = new Set(participantes.map(p => p.tamanho));
    return Array.from(sizes).sort();
  }, [participantes]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nome
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome do participante ou comprador..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade
            </label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as cidades</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho
            </label>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os tamanhos</option>
              {uniqueSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredParticipantes.length}</div>
            <div className="text-sm text-gray-500">Participantes Pagos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {filteredParticipantes.reduce((sum, p) => sum + p.valor_real_pago, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Valor Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(filteredParticipantes.map(p => p.cidade)).size}
            </div>
            <div className="text-sm text-gray-500">Cidades</div>
          </div>
        </div>
      </div>

      {/* Lista de Participantes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Participantes Confirmados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamanho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Igreja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comprador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Pago
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParticipantes.map((participante) => (
                <tr key={participante.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {participante.nome}
                      </div>
                      {participante.telefone && (
                        <div className="text-sm text-gray-500">
                          {participante.telefone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {participante.tamanho}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {participante.cidade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {participante.igreja}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {participante.comprador_nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        {participante.comprador_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    R$ {participante.valor_real_pago.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente da aba Pedidos
const PedidosTab: React.FC<{
  pedidos: PaymentDetails[];
  dateFilter: '7d' | '30d' | '90d' | 'all';
  setDateFilter: (filter: '7d' | '30d' | '90d' | 'all') => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
}> = ({ pedidos, dateFilter, setDateFilter, statusFilter, setStatusFilter }) => {
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="all">Todos os períodos</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas dos Pedidos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo dos Pedidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{pedidos.length}</div>
            <div className="text-sm text-gray-500">Total de Pedidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {pedidos.filter(p => p.pagamento_aprovado).length}
            </div>
            <div className="text-sm text-gray-500">Pedidos Pagos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {pedidos.filter(p => p.status_pedido === 'pendente').length}
            </div>
            <div className="text-sm text-gray-500">Pedidos Pendentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {pedidos.filter(p => p.pagamento_aprovado).reduce((sum, p) => sum + (p.valor_pago_real || 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Valor Total Pago</div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Pedidos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comprador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pedidos.map((pedido) => (
                <tr key={pedido.pedido_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{pedido.pedido_id.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pedido.tipo_pedido}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {pedido.comprador_nome}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pedido.comprador_email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pedido.pagamento_aprovado
                        ? 'bg-green-100 text-green-800'
                        : pedido.status_pedido === 'pendente'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pedido.status_pagamento_descricao || pedido.status_pedido}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pedido.metodo_pagamento_descricao || 'Não informado'}
                    {pedido.parcelas && pedido.parcelas > 1 && (
                      <div className="text-xs text-gray-500">
                        {pedido.parcelas}x
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {(pedido.valor_pago_real || pedido.valor_pedido_original).toFixed(2)}
                    </div>
                    {pedido.taxa_mp && (
                      <div className="text-xs text-gray-500">
                        Taxa: R$ {pedido.taxa_mp.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(pedido.data_criacao_pedido).toLocaleDateString('pt-BR')}
                    {pedido.data_aprovacao_pagamento && (
                      <div className="text-xs text-gray-500">
                        Pago: {new Date(pedido.data_aprovacao_pagamento).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PainelControle;