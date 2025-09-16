import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import CustomDropdown from '../components/CustomDropdown';

interface Participant {
  id: string;
  nome: string;
  tamanho: string;
  telefone?: string;
  cidade?: string;
  igreja?: string;
  observacoes?: string;
  comprador_nome: string;
  comprador_email: string;
  comprador_tipo: string;
  pedido_id: string;
  pedido_status: string;
  pedido_valor: number;
  item_quantidade: number;
  item_preco: number;
  valor_real_pago: number;
  created_at: string;
}

interface Sale {
  lider: string;
  igreja: string;
  cidade: string;
  participantes: Participant[];
}

interface DashboardStats {
  receita: number;
  camisetas: number;
  participantes: number;
  cidades: number;
  pedidosPagos: number;
  pedidosPendentes: number;
}

interface OrdersData {
  pedido_id: string;
  comprador_nome: string;
  comprador_email: string;
  comprador_telefone?: string | null;
  comprador_tipo: string;
  status_pedido: string;
  participantes: {
    nome: string;
    tamanho: string;
    quantidade: number;
  }[];
  valor_total: number;
  valor_real_pago?: number;
  mp_status?: string;
  metodo_pagamento?: string;
  metodo_pagamento_descricao?: string;
  data_criacao: string;
}

interface OrdersStats {
  camisetasRecebidas: number;
  camisetasPendentes: number;
  camisetasTotal: number;
  pedidosPagos: number;
  pedidosPendentes: number;
  pedidosTotal: number;
  tamanhosRecebidos: { [key: string]: number };
  tamanhosPendentes: { [key: string]: number };
  receitaTotal: number;
  receitaPendente: number;
}

const DashboardAdm: React.FC = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'pedidos' | 'participantes' | 'etiquetas'>('pedidos');
  const [selectedEtiquetas, setSelectedEtiquetas] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrdersData | null>(null);

  // Estados para filtros
  const [searchName, setSearchName] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Função para obter cores consistentes baseadas no tamanho
  const getSizeColor = (tamanho: string) => {
    const sizeColorMap: { [key: string]: { bg: string; text: string; badge: string } } = {
      'P': { bg: 'bg-blue-500', text: 'text-blue-400', badge: 'bg-blue-100 text-blue-800' },
      'M': { bg: 'bg-green-500', text: 'text-green-400', badge: 'bg-green-100 text-green-800' },
      'G': { bg: 'bg-yellow-500', text: 'text-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
      'GG': { bg: 'bg-orange-500', text: 'text-orange-400', badge: 'bg-orange-100 text-orange-800' },
      'XG': { bg: 'bg-red-500', text: 'text-red-400', badge: 'bg-red-100 text-red-800' },
      'XXG': { bg: 'bg-purple-500', text: 'text-purple-400', badge: 'bg-purple-100 text-purple-800' },
      'E1': { bg: 'bg-pink-500', text: 'text-pink-400', badge: 'bg-pink-100 text-pink-800' },
      'E2': { bg: 'bg-indigo-500', text: 'text-indigo-400', badge: 'bg-indigo-100 text-indigo-800' }
    };
    return sizeColorMap[tamanho] || { bg: 'bg-gray-500', text: 'text-gray-400', badge: 'bg-gray-100 text-gray-800' };
  };

  const handleEtiquetaToggle = (participantId: string) => {
    setSelectedEtiquetas(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const handleSelectAllEtiquetas = () => {
    const filteredIds = filteredParticipants.map(p => p.id);
    setSelectedEtiquetas(prev => {
      const newSelected = [...prev];
      filteredIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      return newSelected;
    });
  };

  const handleDeselectAllEtiquetas = () => {
    const filteredIds = filteredParticipants.map(p => p.id);
    setSelectedEtiquetas(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const printEtiquetas = () => {
    const selectedParticipants = participants.filter(p => selectedEtiquetas.includes(p.id));

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Mapeamento de cores por tamanho conforme especificação
    const colorMap: { [key: string]: string } = {
      'P': '#3B82F6',   // bg-blue-500
      'M': '#10B981',   // bg-green-500
      'G': '#EAB308',   // bg-yellow-500
      'GG': '#F97316',  // bg-orange-500
      'XG': '#EF4444',  // bg-red-500
      'XXG': '#A855F7', // bg-purple-500
      'E1': '#EC4899',  // bg-pink-500
      'E2': '#6366F1',  // bg-indigo-500
    };

    const getColorForSize = (tamanho: string): string => {
      return colorMap[tamanho] || '#9CA3AF'; // gray-400 como padrão
    };

    // Preencher até 33 etiquetas (3x11 grid)
    const totalLabels = 33;
    const labels = [...selectedParticipants];
    while (labels.length < totalLabels) {
      labels.push({
        id: `empty-${labels.length}`,
        nome: '',
        tamanho: '',
        igreja: '',
        cidade: '',
        comprador_nome: '',
        comprador_email: '',
        comprador_tipo: '',
        pedido_id: '',
        pedido_status: '',
        pedido_valor: 0,
        item_quantidade: 0,
        item_preco: 0,
        valor_real_pago: 0,
        created_at: ''
      });
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Impressão de Etiquetas - UMADEPAR</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
              /* Estilos gerais e reset */
              body {
                  margin: 0;
                  font-family: 'Inter', sans-serif;
                  background-color: #fff;
              }

              /* Estilização da folha A4 para visualização na tela */
              .a4-sheet {
                  width: 210mm;
                  height: 297mm;
                  margin: 0;
                  background: white;
                  box-shadow: none;
                  box-sizing: border-box;
                  padding: 16px;
              }

              /* Grid que contém todas as etiquetas */
              .labels-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  grid-template-rows: repeat(11, 1fr);
                  height: calc(297mm - 32px);
                  width: calc(210mm - 32px);
                  gap: 0;
              }

              /* Estilo individual de cada etiqueta */
              .label {
                  display: flex;
                  align-items: stretch;
                  overflow: hidden;
                  border: 0.5px solid #f0f2f5;
              }

              .color-bar {
                  width: 10px;
                  flex-shrink: 0;
              }

              .content {
                  flex-grow: 1;
                  padding: 5px 8px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }

              .info {
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  gap: 1px;
                  width: calc(100% - 42px);
              }

              .participant-name {
                  font-size: 14px;
                  font-weight: 800;
                  color: #111827;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
              }

              .divider {
                  height: 1px;
                  background-color: #d1d5db;
                  width: 100%;
                  margin: 1px 0;
              }

              .details {
                  font-size: 11px;
                  color: #374151;
                  line-height: 1.3;
              }
              .details strong {
                  font-weight: 700;
              }

              .size-badge {
                  width: 37px;
                  height: 37px;
                  border-radius: 50%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  color: white;
                  font-size: 16px;
                  font-weight: 800;
                  flex-shrink: 0;
              }
              
              /* Estilos para impressão */
              @media print {
                  .a4-sheet {
                      padding: 16px;
                  }
                  .label {
                      border: none;
                  }
              }
              
              @page {
                  size: A4;
                  margin: 0;
              }
          </style>
      </head>
      <body>
          <div class="a4-sheet">
              <div class="labels-grid">
                  ${labels.slice(0, totalLabels).map(participant => {
      if (!participant.nome) {
        return '<div class="label"></div>';
      }

      const color = getColorForSize(participant.tamanho);
      return `
                      <div class="label">
                          <div class="color-bar" style="background-color: ${color};"></div>
                          <div class="content">
                              <div class="info">
                                  <div class="participant-name">${participant.nome}</div>
                                  <div class="divider"></div>
                                  <div class="details">
                                      <strong>Igreja:</strong> ${participant.igreja || 'Não informado'}<br>
                                      <strong>Cidade:</strong> ${participant.cidade || 'Não informado'}<br>
                                      <strong>Comprador:</strong> ${participant.comprador_nome} <span style="display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 12px; font-size: 10px; font-weight: 600; margin-left: 4px; ${participant.comprador_tipo === 'lider' ? 'background-color: rgba(147, 51, 234, 0.2); color: #7c3aed; border: 1px solid rgba(147, 51, 234, 0.3);' : 'background-color: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3);'}">${participant.comprador_tipo === 'lider' ? 'LÍDER' : 'JOVEM'}</span>
                                  </div>
                              </div>
                              <div class="size-badge" style="background-color: ${color};">
                                  ${participant.tamanho}
                              </div>
                          </div>
                      </div>`;
    }).join('')}
              </div>
          </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setShowPrintModal(false);
    setSelectedEtiquetas([]);
  };

  const kpis = {
    receita: 0,
    camisetas: 0,
    participantes: 0,
    cidades: 0,
    pedidosPagos: 0,
    pedidosPendentes: 0
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('tipo')
        .eq('id', userData.user.id)
        .single();

      if (profileError) throw profileError;

      if (userProfile.tipo !== 'admin') {
        throw new Error('Acesso negado. Apenas administradores podem acessar esta página.');
      }

      const { data, error } = await supabase
        .from('vw_participantes_completo')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setParticipants(data || []);
      await fetchOrdersData();
    } catch (err: any) {
      console.error('Erro ao buscar participantes:', err);
      setError(err.message);
      await fetchOrdersData();
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersData = async () => {
    try {
      console.log('🔍 [DashboardAdm] Iniciando busca de dados da view vw_payment_details...');

      // Buscar diretamente da view vw_payment_details
      const { data: paymentData, error: paymentError } = await supabase
        .from('vw_payment_details')
        .select('*')
        .order('data_criacao_pedido', { ascending: false });

      if (paymentError) {
        console.error('❌ [DashboardAdm] Erro ao buscar da view vw_payment_details:', paymentError);
        throw paymentError;
      }

      console.log('✅ [DashboardAdm] Dados encontrados na view vw_payment_details:', paymentData?.length || 0);
      console.log('📊 [DashboardAdm] Dados de exemplo:', paymentData?.slice(0, 2));

      // Transformar dados da view para o formato esperado
      const transformedData = await Promise.all((paymentData || []).map(async (item: any) => {
        const { data: participantesData } = await supabase
          .from('vw_participantes_completo')
          .select('nome, tamanho, item_quantidade')
          .eq('pedido_id', item.pedido_id);

        // Buscar telefone do comprador
        console.log('🔍 [DashboardAdm] Buscando telefone para user_id:', item.user_id);
        const { data: compradorData, error: compradorError } = await supabase
          .from('users')
          .select('telefone')
          .eq('id', item.user_id)
          .single();
        
        if (compradorError) {
          console.error('❌ [DashboardAdm] Erro ao buscar telefone do comprador:', compradorError);
        } else {
          console.log('✅ [DashboardAdm] Telefone encontrado:', compradorData?.telefone);
        }

        const orderData = {
          pedido_id: item.pedido_id,
          comprador_nome: item.comprador_nome,
          comprador_email: item.comprador_email,
          comprador_telefone: compradorData?.telefone || null,
          comprador_tipo: item.comprador_tipo || 'jovem',
          status_pedido: item.status_pedido,
          participantes: (participantesData || []).map((p: any) => ({
            nome: p.nome,
            tamanho: p.tamanho,
            quantidade: p.item_quantidade
          })),
          valor_total: item.valor_pedido_original,
          valor_real_pago: item.valor_pago_real || item.valor_pedido_original,
          mp_status: item.mp_status,
          metodo_pagamento: item.metodo_pagamento,
          metodo_pagamento_descricao: item.metodo_pagamento_descricao,
          data_criacao: item.data_criacao_pedido
        };
        
        console.log('📦 [DashboardAdm] Objeto final do pedido:', orderData);
        return orderData;
      }));

      console.log('✅ [DashboardAdm] Dados transformados:', transformedData?.length || 0);
      console.log('📊 [DashboardAdm] Exemplo de dados transformados:', transformedData?.slice(0, 2));
      
      setOrdersData(transformedData);

      console.log('✅ [DashboardAdm] Dados carregados com sucesso');
    } catch (err: any) {
      console.error('❌ [DashboardAdm] Erro ao buscar dados:', err);
      setOrdersData([]);
    }
  };

  const exportOrdersData = () => {
    const csvContent = [
      ['Pedido ID', 'Comprador', 'Email', 'Tipo', 'Status', 'Participantes', 'Camisetas', 'Valor Total', 'Data'].join(','),
      ...ordersData.map(order => [
        order.pedido_id,
        `"${order.comprador_nome}"`,
        order.comprador_email,
        order.comprador_tipo,
        order.status_pedido,
        order.participantes.length,
        order.participantes.reduce((sum, p) => sum + p.quantidade, 0),
        order.valor_total,
        new Date(order.data_criacao).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchParticipants();
    fetchUniqueCities();
    fetchUniqueSizes();
  }, []);

  const calculateStats = (participants: Participant[], pedidos: any[] = []) => {
    const statusMap = new Map(pedidos.map(p => [p.id, p.status]));

    const participantesPagos = participants.filter(p => {
      const status = statusMap.get(p.pedido_id);
      return status === 'pago';
    });

    const receita = participantesPagos.reduce((sum, p) => sum + p.valor_real_pago, 0);
    const camisetas = participantesPagos.reduce((sum, p) => sum + p.item_quantidade, 0);
    const cidades = new Set(participants.map(p => p.cidade).filter(Boolean)).size;

    const pedidosPagos = pedidos.filter(p => p.status === 'pago').length;
    const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;

    return {
      receita,
      camisetas,
      participantes: participants.length,
      cidades,
      pedidosPagos,
      pedidosPendentes
    };
  };

  // Estados para dados de filtros
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);
  const [uniqueSizes, setUniqueSizes] = useState<string[]>([]);

  // Função para buscar cidades únicas do banco de dados (apenas pedidos pagos)
  const fetchUniqueCities = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_participantes_completo')
        .select('cidade')
        .eq('pedido_status', 'pago')
        .not('cidade', 'is', null)
        .not('cidade', 'eq', '')
        .order('cidade');

      if (error) throw error;

      const cities = [...new Set(data?.map(item => item.cidade) || [])].sort();
      setUniqueCities(cities);
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
    }
  };

  // Função para buscar tamanhos únicos do banco de dados com ordenação correta (apenas pedidos pagos)
  const fetchUniqueSizes = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_participantes_completo')
        .select('tamanho')
        .eq('pedido_status', 'pago')
        .not('tamanho', 'is', null)
        .not('tamanho', 'eq', '');

      if (error) throw error;

      const sizes = [...new Set(data?.map(item => item.tamanho) || [])];

      // Ordenação customizada dos tamanhos do menor para o maior
      const sizeOrder = ['P', 'M', 'G', 'GG', 'XG', 'XXG', 'E1', 'E2'];
      const sortedSizes = sizes.sort((a, b) => {
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);

        // Se ambos estão na lista de ordenação, usar a ordem definida
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // Se apenas um está na lista, o que está na lista vem primeiro
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // Se nenhum está na lista, ordenação alfabética
        return a.localeCompare(b);
      });

      setUniqueSizes(sortedSizes);
    } catch (error) {
      console.error('Erro ao buscar tamanhos:', error);
    }
  };

  // Funções para filtros (mantidas para compatibilidade)
  const getUniqueCities = () => uniqueCities;
  const getUniqueSizes = () => uniqueSizes;

  const getFilteredParticipants = () => {
    return participants.filter(participant => {
      // Filtrar apenas participantes de pedidos pagos
      const isPaid = participant.pedido_status === 'pago';

      const matchesName = searchName === '' ||
        participant.nome.toLowerCase().includes(searchName.toLowerCase());
      const matchesCity = selectedCity === '' || participant.cidade === selectedCity;
      const matchesSize = selectedSize === '' || participant.tamanho === selectedSize;

      return isPaid && matchesName && matchesCity && matchesSize;
    });
  };

  const filteredParticipants = getFilteredParticipants();
  const stats = calculateStats(participants);

  // Cálculo das métricas em tempo real
  const metrics = useMemo(() => {
    // Filtrar pagamentos aprovados
    const pagamentosAprovados = ordersData.filter(order => order.status_pedido === 'pago');
    
    // Total Arrecadado - soma de valor_real_pago de todos os pagamentos aprovados
    const totalArrecadado = pagamentosAprovados.reduce((sum, order) => {
      return sum + (order.valor_real_pago || order.valor_total);
    }, 0);
    
    // Taxas Mercado Pago - assumindo 4.99% + R$ 0.39 por transação PIX e 5.99% + R$ 0.39 para cartão
    const taxasMercadoPago = pagamentosAprovados.reduce((sum, order) => {
      const valor = order.valor_real_pago || order.valor_total;
      let taxa = 0;
      
      if (order.metodo_pagamento_descricao === 'PIX') {
        taxa = (valor * 0.0499) + 0.39; // 4.99% + R$ 0.39
      } else if (order.metodo_pagamento_descricao?.includes('Cartão')) {
        taxa = (valor * 0.0599) + 0.39; // 5.99% + R$ 0.39
      } else {
        taxa = (valor * 0.0549) + 0.39; // Taxa média 5.49% + R$ 0.39
      }
      
      return sum + taxa;
    }, 0);
    
    // Valor Líquido - Total arrecadado menos taxas
    const valorLiquido = totalArrecadado - taxasMercadoPago;
    
    // Camisetas Pagas - contagem de participantes com pedido_status === 'pago'
    const camisetasPagas = participants.filter(p => p.pedido_status === 'pago').length;
    
    return {
      totalArrecadado,
      taxasMercadoPago,
      valorLiquido,
      camisetasPagas
    };
  }, [ordersData, participants]);

  const groupedSales = participants.reduce((acc, participant) => {
    const key = `${participant.comprador_nome}-${participant.igreja || 'Sem igreja'}-${participant.cidade || 'Sem cidade'}`;

    if (!acc[key]) {
      acc[key] = {
        lider: participant.comprador_nome,
        igreja: participant.igreja || 'Não informado',
        cidade: participant.cidade || 'Não informado',
        participantes: []
      };
    }

    acc[key].participantes.push(participant);
    return acc;
  }, {} as Record<string, Sale>);

  const sales = Object.values(groupedSales);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] to-[#1a374e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#edbe66] mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] to-[#1a374e] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
            <h2 className="text-red-400 text-xl font-bold mb-2">Erro</h2>
            <p className="text-white">{error}</p>
            <Link
              to="/"
              className="inline-block mt-4 px-4 py-2 bg-[#edbe66] text-[#0f2b45] rounded-lg hover:bg-[#d4a853] transition-colors"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2b45] to-[#1a374e] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Painel Adm</h1>
              <p className="text-white/80">Bem-vindo, {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'usuário'}</p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 bg-[#edbe66] text-[#0f2b45] rounded-full hover:bg-[#d4a853] transition-colors font-medium"
            >
              <span className="hidden sm:inline">Voltar ao Início</span>
              <span className="sm:hidden">←</span>
            </Link>
          </div>

        {/* Navigation */}
        <div className="flex flex-row space-x-2 sm:space-x-4 mb-8">
          <button
            onClick={() => setActiveView('pedidos')}
            className={`px-2 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-colors text-sm sm:text-lg flex-1 sm:flex-none ${
              activeView === 'pedidos'
                ? 'bg-[#edbe66] text-[#1a374e]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="hidden sm:inline">Financeiro</span>
            <span className="sm:hidden">Financeiro</span>
          </button>
          <button
            onClick={() => setActiveView('participantes')}
            className={`px-2 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-colors text-sm sm:text-lg flex-1 sm:flex-none ${
              activeView === 'participantes'
                ? 'bg-[#edbe66] text-[#1a374e]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="hidden sm:inline">Participantes</span>
            <span className="sm:hidden">Participantes</span>
          </button>
          <button
            onClick={() => setActiveView('etiquetas')}
            className={`px-2 sm:px-6 py-2 sm:py-3 rounded-full font-medium transition-colors text-sm sm:text-lg flex-1 sm:flex-none ${
              activeView === 'etiquetas'
                ? 'bg-[#edbe66] text-[#1a374e]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <span className="hidden sm:inline">Etiquetas</span>
            <span className="sm:hidden">Etiquetas</span>
          </button>
        </div>

        {/* Participants View */}
        {activeView === 'participantes' && (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-[#1a374e] rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Busca por nome */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Buscar por nome</label>
                  <input
                    type="text"
                    placeholder="Digite o nome..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#edbe66] focus:border-transparent"
                  />
                </div>

                {/* Filtro por cidade */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Filtrar por cidade</label>
                  <CustomDropdown
                    value={selectedCity}
                    onChange={setSelectedCity}
                    options={[
                      { value: '', label: 'Todas as cidades' },
                      ...getUniqueCities().map(city => ({ value: city, label: city }))
                    ]}
                    placeholder="Todas as cidades"
                  />
                </div>

                {/* Filtro por tamanho */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Filtrar por tamanho</label>
                  <CustomDropdown
                    value={selectedSize}
                    onChange={setSelectedSize}
                    options={[
                      { value: '', label: 'Todos os tamanhos' },
                      ...getUniqueSizes().map(size => ({ value: size, label: size }))
                    ]}
                    placeholder="Todos os tamanhos"
                  />
                </div>
              </div>

              {/* Botão para limpar filtros */}
              {(searchName || selectedCity || selectedSize) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchName('');
                      setSelectedCity('');
                      setSelectedSize('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#1a374e] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-xl font-bold text-white">Lista de Participantes</h3>
                <p className="text-white/60 text-sm mt-1">
                  Exibindo: {filteredParticipants.length} de {participants.length} participantes
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Tamanho</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Telefone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Comprador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Igreja</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Cidade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Valor Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredParticipants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-white">{participant.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSizeColor(participant.tamanho).badge}`}>
                            {participant.tamanho}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">
                          <div className="flex items-center gap-2">
                            <span>{participant.telefone || 'Não informado'}</span>
                            {participant.telefone && (
                              <a
                                href={`https://wa.me/55${participant.telefone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
                                title="Enviar mensagem no WhatsApp"
                              >
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                </svg>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">
                          <div className="flex items-center gap-2">
                            <span>{participant.comprador_nome}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              participant.comprador_tipo === 'lider'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                            }`}>
                              {participant.comprador_tipo === 'lider' ? 'LÍDER' : 'JOVEM'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">{participant.igreja || 'Não informado'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">{participant.cidade || 'Não informado'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                          R$ {participant.valor_real_pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Etiquetas View */}
        {activeView === 'etiquetas' && (
          <div className="space-y-6">
            {/* Filtros para Etiquetas */}
            <div className="bg-[#1a374e] rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Busca por nome */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Buscar por nome</label>
                  <input
                    type="text"
                    placeholder="Digite o nome..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#edbe66] focus:border-transparent"
                  />
                </div>

                {/* Filtro por cidade */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Filtrar por cidade</label>
                  <CustomDropdown
                    value={selectedCity}
                    onChange={setSelectedCity}
                    options={[
                      { value: '', label: 'Todas as cidades' },
                      ...getUniqueCities().map(city => ({ value: city, label: city }))
                    ]}
                    placeholder="Todas as cidades"
                  />
                </div>

                {/* Filtro por tamanho */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Filtrar por tamanho</label>
                  <CustomDropdown
                    value={selectedSize}
                    onChange={setSelectedSize}
                    options={[
                      { value: '', label: 'Todos os tamanhos' },
                      ...getUniqueSizes().map(size => ({ value: size, label: size }))
                    ]}
                    placeholder="Todos os tamanhos"
                  />
                </div>
              </div>

              {/* Botão para limpar filtros */}
              {(searchName || selectedCity || selectedSize) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchName('');
                      setSelectedCity('');
                      setSelectedSize('');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#1a374e] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Lista para Etiquetas</h3>
                  <p className="text-white/60 text-sm mt-1">
                    Exibindo: {filteredParticipants.length} de {participants.length} participantes
                  </p>
                </div>
                <button
                  onClick={() => setShowPrintModal(true)}
                  disabled={selectedEtiquetas.length === 0}
                  className="px-4 py-2 bg-[#edbe66] text-[#0f2b45] rounded-full hover:bg-[#d4a853] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="hidden sm:inline">
                    Imprimir Selecionadas ({selectedEtiquetas.length})
                  </span>
                  <span className="sm:hidden">
                    ({selectedEtiquetas.length})
                  </span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filteredParticipants.length > 0 && filteredParticipants.every(p => selectedEtiquetas.includes(p.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleSelectAllEtiquetas();
                              } else {
                                handleDeselectAllEtiquetas();
                              }
                            }}
                            className="w-4 h-4 text-[#edbe66] bg-white/10 border-white/20 rounded focus:ring-[#edbe66] focus:ring-2"
                          />

                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">TAMANHO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Comprador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Igreja</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">CIDADE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredParticipants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedEtiquetas.includes(participant.id)}
                            onChange={() => handleEtiquetaToggle(participant.id)}
                            className="rounded border-white/20 bg-white/10 text-[#edbe66] focus:ring-[#edbe66]"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">{participant.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSizeColor(participant.tamanho).badge}`}>
                            {participant.tamanho}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">{participant.comprador_nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">{participant.igreja || 'Não informado'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/80">{participant.cidade || 'Não informado'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'pedidos' && (
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Arrecadado */}
              <div className="bg-[#1a374e] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">R$</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Total Arrecadado</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {metrics.totalArrecadado.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Taxas (MP) */}
              <div className="bg-[#1a374e] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">%</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Taxas (MP)</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {metrics.taxasMercadoPago.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Valor Líquido */}
              <div className="bg-[#1a374e] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-sm">💰</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Valor Líquido</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {metrics.valorLiquido.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Camisetas Pagas */}
              <div className="bg-[#1a374e] rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                    <span className="text-white text-sm">👕</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Camisetas Pagas</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics.camisetasPagas}
                    </p>
                  </div>
                </div>
              </div>


            </div>

            {/* Gráficos Dinâmicos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                {/* Gráfico de Status dos Pedidos */}
                <div className="bg-[#1a374e] rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Status dos Pedidos</h3>
                  <div className="space-y-4">
                    {[
                      {
                        status: 'Pagos',
                        count: ordersData.filter(order => order.status_pedido === 'pago').length,
                        value: ordersData.filter(order => order.status_pedido === 'pago').reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-green-500',
                        textColor: 'text-green-400'
                      },
                      {
                        status: 'Pendentes',
                        count: ordersData.filter(order => order.status_pedido === 'pendente').length,
                        value: ordersData.filter(order => order.status_pedido === 'pendente').reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-yellow-500',
                        textColor: 'text-yellow-400'
                      },
                      {
                        status: 'Cancelados',
                        count: ordersData.filter(order => order.status_pedido === 'cancelado').length,
                        value: ordersData.filter(order => order.status_pedido === 'cancelado').reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-red-500',
                        textColor: 'text-red-400'
                      }
                    ].map((item) => {
                      const total = ordersData.length;
                      const percentage = total > 0 ? (item.count / total) * 100 : 0;

                      return (
                        <div key={item.status} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{item.status} ({item.count})</span>
                            <span className={`font-bold ${item.textColor}`}>
                              R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-right">
                            <span className="text-white/60 text-sm">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gráfico de Métodos de Pagamento */}
                <div className="bg-[#1a374e] rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Métodos de Pagamento</h3>
                  <div className="space-y-4">
                    {[
                      {
                        method: 'PIX',
                        count: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'PIX').length,
                        value: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'PIX').reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-emerald-500',
                        textColor: 'text-emerald-400'
                      },
                      {
                        method: 'Cartão de Crédito',
                        count: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'Cartão de Crédito').length,
                        value: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'Cartão de Crédito').reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-blue-500',
                        textColor: 'text-blue-400'
                      },
                      {
                        method: 'Cartão de Débito',
                        count: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'Cartão de Débito').length,
                        value: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'Cartão de Débito').reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-purple-500',
                        textColor: 'text-purple-400'
                      },
                      {
                        method: 'Mercado Pago',
                        count: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'Mercado Pago').length,
                        value: ordersData.filter(order => order.status_pedido === 'pago' && order.metodo_pagamento_descricao === 'Mercado Pago').reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-cyan-500',
                        textColor: 'text-cyan-400'
                      },
                      {
                        method: 'Outros',
                        count: ordersData.filter(order => order.status_pedido === 'pago' && !['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Mercado Pago'].includes(order.metodo_pagamento_descricao || '')).length,
                        value: ordersData.filter(order => order.status_pedido === 'pago' && !['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Mercado Pago'].includes(order.metodo_pagamento_descricao || '')).reduce((sum, order) => sum + (order.valor_real_pago || order.valor_total), 0),
                        color: 'bg-gray-500',
                        textColor: 'text-gray-400'
                      }
                    ].map((item) => {
                      const totalPayments = ordersData.filter(order => order.status_pedido === 'pago').length;
                      const percentage = totalPayments > 0 ? (item.count / totalPayments) * 100 : 0;

                      return (
                        <div key={item.method} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-medium">{item.method} ({item.count})</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-sm">{percentage.toFixed(1)}%</span>
                              <span className={`font-bold ${item.textColor}`}>
                                R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${item.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Coluna Direita */}
              <div>
                {/* Gráfico de Camisetas por Tamanho */}
                <div className="bg-[#1a374e] rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Camisetas por Tamanho</h3>
                  <div className="space-y-4">
                    {(() => {
                      const tamanhos = ['P', 'M', 'G', 'GG', 'XG', 'XXG', 'E1', 'E2'];
                      const totalCamisetas = ordersData.filter(order => order.status_pedido === 'pago').reduce((sum, order) => sum + order.participantes.reduce((pSum, p) => pSum + p.quantidade, 0), 0);

                      return tamanhos.map((tamanho) => {
                        const count = ordersData.filter(order => order.status_pedido === 'pago').reduce((sum, order) => {
                          return sum + order.participantes.filter(p => p.tamanho === tamanho).reduce((pSum, p) => pSum + p.quantidade, 0);
                        }, 0);

                        const percentage = totalCamisetas > 0 ? (count / totalCamisetas) * 100 : 0;
                        const colors = getSizeColor(tamanho);

                        return (
                          <div key={tamanho} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-medium">{tamanho}</span>
                              <span className={`font-bold ${colors.text}`}>
                                {count} unidades
                              </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full ${colors.bg} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-right">
                              <span className="text-white/60 text-sm">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Pedidos */}
            <div className="bg-[#1a374e] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/20 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Lista de Pedidos</h3>
                  <p className="text-white/60 text-sm mt-1">Todos os pedidos realizados</p>
                </div>
                <button
                  onClick={exportOrdersData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Exportar CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Comprador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Participantes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Qtd Camisetas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Valor Pago</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Pagamento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {ordersData.map((order) => {
                      const totalCamisetas = order.participantes.reduce((sum, p) => sum + p.quantidade, 0);

                      return (
                        <tr
                          key={order.pedido_id}
                          className="hover:bg-white/5 cursor-pointer"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-white font-medium">{order.comprador_nome}</div>
                              <div className="text-white/60 text-sm">{order.comprador_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.comprador_tipo === 'lider'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {order.comprador_tipo === 'lider' ? 'Líder' : 'Jovem'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">
                            {order.participantes.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">
                            {totalCamisetas}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                            R$ {(order.valor_real_pago || order.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            {order.valor_real_pago && order.valor_real_pago !== order.valor_total && (
                              <div className="text-xs text-white/60">
                                Original: R$ {order.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white/80 text-sm">
                            {order.metodo_pagamento_descricao || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status_pedido === 'pago'
                                ? 'bg-green-500/20 text-green-400'
                                : order.status_pedido === 'pendente'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {order.status_pedido === 'pago' ? 'Pago' : order.status_pedido === 'pendente' ? 'Pendente' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white/80 text-sm">
                            {new Date(order.data_criacao).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button className="text-[#edbe66] hover:text-[#d4a853] text-sm font-medium">
                              Ver Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )} {/* <-- CORREÇÃO: Removidas as divs extras que estavam aqui */}

        {/* Modal de Confirmação de Impressão */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0f2b45] rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-white mb-4">Confirmar Impressão</h3>
              <p className="text-white/80 mb-6">
                Você está prestes a imprimir {selectedEtiquetas.length} etiqueta(s). Deseja continuar?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={printEtiquetas}
                  className="px-4 py-2 bg-[#edbe66] text-[#1a374e] rounded-lg font-medium hover:bg-[#d4a853] transition-colors"
                >Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes do Pedido */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0f2b45] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Detalhes do Pedido</h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Informações do Comprador */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Informações do Comprador</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <span className="text-white/60 text-sm">Nome:</span>
                      <p className="text-white font-medium">{selectedOrder.comprador_nome}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Email:</span>
                      <p className="text-white font-medium">{selectedOrder.comprador_email}</p>
                    </div>
                    {selectedOrder.comprador_telefone && (
                      <div>
                        <span className="text-white/60 text-sm">Telefone:</span>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{selectedOrder.comprador_telefone}</p>
                          <a
                            href={`https://wa.me/${selectedOrder.comprador_telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-white/60 text-sm">Tipo:</span>
                      <p className="text-white font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedOrder.comprador_tipo === 'lider'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {selectedOrder.comprador_tipo === 'lider' ? 'Líder' : 'Jovem'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Data do Pedido:</span>
                      <p className="text-white font-medium">{new Date(selectedOrder.data_criacao).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {/* Status e Valor */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Status e Valor</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-white/60 text-sm">Status:</span>
                      <p className="text-white font-medium">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedOrder.status_pedido === 'pago'
                            ? 'bg-green-500/20 text-green-400'
                            : selectedOrder.status_pedido === 'pendente'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedOrder.status_pedido === 'pago' ? 'Pago' : selectedOrder.status_pedido === 'pendente' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Valor Total:</span>
                      <p className="text-white font-medium text-lg">
                        R$ {selectedOrder.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de Participantes */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Participantes ({selectedOrder.participantes.length})</h4>
                  <div className="space-y-3">
                    {selectedOrder.participantes.map((participante, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{participante.nome}</p>
                            <p className="text-white/60 text-sm">Tamanho: {participante.tamanho}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">Qtd: {participante.quantidade}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-3">Resumo</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-white/60 text-sm">Total de Participantes:</span>
                      <p className="text-white font-medium">{selectedOrder.participantes.length}</p>
                    </div>
                    <div>
                      <span className="text-white/60 text-sm">Total de Camisetas:</span>
                      <p className="text-white font-medium">
                        {selectedOrder.participantes.reduce((sum, p) => sum + p.quantidade, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-6 py-2 bg-[#edbe66] text-[#1a374e] rounded-lg font-medium hover:bg-[#d4a853] transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAdm;