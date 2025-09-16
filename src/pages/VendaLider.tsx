import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderService, type GroupOrderData, type Participante } from '../services/orderService';
import { useShirtQuantityPersistence, useParticipantsPersistence } from '../hooks/useFormPersistence';
import { useAuth } from '../contexts/AuthContext';

interface ParticipantField {
  id: string;
  name: string;
}

const VendaLider: React.FC = () => {
  // Auth context
  const { user, userData, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // User dropdown functions
  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para determinar o lote atual baseado na data
  const getCurrentLot = () => {
    const now = new Date();
    const october31 = new Date('2025-10-31T23:59:59');
    const eventDate = new Date('2025-12-15T00:00:00');
    const twentyDaysBefore = new Date(eventDate.getTime() - (20 * 24 * 60 * 60 * 1000));

    if (now <= october31) {
      return 1; // Primeiro lote
    } else if (now <= twentyDaysBefore) {
      return 2; // Segundo lote
    } else {
      return 3; // Terceiro lote (apenas no local)
    }
  };

  // Função para obter informações de todos os lotes
  const getAllLots = () => {
    const currentLotNumber = getCurrentLot();
    
    return [
      {
        number: 1,
        name: '1º Lote - Promoção Especial',
        description: 'Até 31/10/2025',
        price: 35.00,
        status: currentLotNumber === 1 ? 'active' : currentLotNumber > 1 ? 'expired' : 'upcoming',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700'
      },
      {
        number: 2,
        name: '2º Lote - Últimas Semanas',
        description: 'Nov até 25/11/2025',
        price: 45.00,
        status: currentLotNumber === 2 ? 'active' : currentLotNumber > 2 ? 'expired' : 'upcoming',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700'
      },
      {
        number: 3,
        name: '3º Lote - No Local',
        description: 'Apenas no dia do evento de 2025',
        price: 50.00,
        status: currentLotNumber === 3 ? 'active' : 'upcoming',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        textColor: 'text-purple-700'
      }
    ];
  };

  const currentLot = getAllLots().find(lot => lot.status === 'active') || getAllLots()[0];
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  // Persistência de quantidades
  const {
    data: quantities,
    setData: setQuantities,
    isDataRecovered: isQuantitiesRecovered,
    handleSuccessfulSubmit: clearQuantities
  } = useShirtQuantityPersistence('venda-lider');
  
  // Persistência de participantes
  const {
    data: participantFields,
    setData: setParticipantFields,
    isDataRecovered: isParticipantsRecovered,
    handleSuccessfulSubmit: clearParticipants
  } = useParticipantsPersistence('venda-lider');
  
  const isDataRecovered = isQuantitiesRecovered || isParticipantsRecovered;
  const [showParticipants, setShowParticipants] = useState<Record<string, boolean>>({
    P: false,
    M: false,
    G: false,
    GG: false,
    XG: false,
    XXG: false,
    E1: false,
    E2: false
  });

  const images = [
    'https://placehold.co/600x600/0f2b45/ffffff?text=Frente',
    'https://placehold.co/600x600/0f2b45/ffffff?text=Costas',
    'https://placehold.co/600x600/edbe66/0f2b45?text=Detalhe'
  ];

  const sizes = ['P', 'M', 'G', 'GG', 'XG', 'XXG', 'E1', 'E2'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const updateQuantity = (size: string, action: 'increase' | 'decrease') => {
    setQuantities(prev => {
      const currentQty = prev[size];
      const newQty = action === 'increase' ? currentQty + 1 : Math.max(0, currentQty - 1);
      
      // Update participant fields when quantity changes
      updateParticipantFields(size, newQty);
      
      return {
        ...prev,
        [size]: newQty
      };
    });
  };

  const setQuantityDirect = (size: string, value: number) => {
    const newQty = Math.max(0, value);
    setQuantities(prev => ({
      ...prev,
      [size]: newQty
    }));
    updateParticipantFields(size, newQty);
  };

  const updateParticipantFields = (size: string, quantity: number) => {
    setParticipantFields(prev => {
      const currentFields = prev[size] || [];
      const newFields: ParticipantField[] = [];
      
      for (let i = 0; i < quantity; i++) {
        newFields.push({
          id: `${size}-${i}`,
          name: currentFields[i]?.name || ''
        });
      }
      
      return {
        ...prev,
        [size]: newFields
      };
    });
  };

  const updateParticipantName = (size: string, index: number, name: string) => {
    setParticipantFields(prev => ({
      ...prev,
      [size]: prev[size].map((field, i) => 
        i === index ? { ...field, name } : field
      )
    }));
  };

  const toggleParticipantsVisibility = (size: string) => {
    setShowParticipants(prev => ({
      ...prev,
      [size]: !prev[size]
    }));
  };

  const getTotalQuantity = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return getTotalQuantity() * currentLot.price;
  };

  const handleBuyClick = async () => {
    const totalQuantity = getTotalQuantity();
    
    if (totalQuantity === 0) {
      alert('Por favor, adicione pelo menos uma camiseta.');
      return;
    }
    
    // Check if all participant names are filled
    const missingFields: string[] = [];
    let firstEmptyFieldId: string | null = null;
    
    // Só verificar campos de tamanhos que têm quantidade > 0
    Object.entries(quantities).forEach(([size, quantity]) => {
      if (quantity > 0) {
        const fields = participantFields[size] || [];
        
        // Se não temos campos suficientes, criar os campos necessários
        if (fields.length < quantity) {
          // Força a criação dos campos se eles não existem
          updateParticipantFields(size, quantity);
          // Como o estado é assíncrono, vamos assumir que todos os campos estão vazios
          for (let i = 0; i < quantity; i++) {
            const fieldId = `${size}-${i}`;
            missingFields.push(`Participante ${i + 1} - Tamanho ${size}`);
            if (!firstEmptyFieldId) {
              firstEmptyFieldId = fieldId;
            }
          }
        } else {
          // Verificar campos existentes
          fields.forEach((field, index) => {
            if (!field.name.trim()) {
              missingFields.push(`Participante ${index + 1} - Tamanho ${size}`);
              if (!firstEmptyFieldId) {
                firstEmptyFieldId = field.id;
              }
            }
          });
        }
      }
    });
    
    if (missingFields.length > 0) {
      // Focar no primeiro campo vazio
      if (firstEmptyFieldId) {
        setTimeout(() => {
          const element = document.querySelector(`input[data-field-id="${firstEmptyFieldId}"]`) as HTMLInputElement;
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Adicionar uma classe para destacar o campo
            element.classList.add('ring-2', 'ring-red-500', 'border-red-500');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-red-500', 'border-red-500');
            }, 3000);
          }
        }, 100);
      }
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      console.log('🛒 [VendaLider] Iniciando processo de compra em grupo:', {
        quantities,
        totalPrice: getTotalPrice(),
        currentLot: {
          price: currentLot.price,
          name: currentLot.name
        },
        timestamp: new Date().toISOString()
      });

      // Preparar participantes estruturados
      const participantes: Participante[] = [];
      Object.entries(quantities).forEach(([size, quantity]) => {
        if (quantity > 0) {
          const fields = participantFields[size] || [];
          fields.forEach((field, index) => {
            if (index < quantity && field.name.trim()) {
              participantes.push({
                nome: field.name.trim(),
                tamanho: size
              });
            }
          });
        }
      });

      console.log('👥 [VendaLider] Participantes processados:', {
        participantCount: participantes.length,
        participantes,
        timestamp: new Date().toISOString()
      });

      // Preparar itens do pedido
      const itens = Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([size, quantity]) => ({
          tamanho: size,
          quantidade: quantity,
          preco_unitario: currentLot.price
        }));

      // Preparar dados estruturados para o pedido em grupo
      const groupOrderData: GroupOrderData = {
        tipo_pedido: 'grupo',
        valor_total: getTotalPrice(),
        itens,
        participantes
      };

      console.log('📦 [VendaLider] Dados estruturados do pedido em grupo:', {
        groupOrderData,
        timestamp: new Date().toISOString()
      });

      // Cria o pedido em grupo usando RPC e inicia o pagamento
      const paymentUrl = await OrderService.createGroupOrder(groupOrderData);

      console.log('✅ [VendaLider] Pagamento em grupo criado com sucesso:', {
        paymentUrl,
        itemCount: itens.length,
        totalValue: getTotalPrice(),
        timestamp: new Date().toISOString()
      });

      // Limpa os dados persistidos após sucesso
      clearQuantities();
      clearParticipants();

      // Abre o checkout do Mercado Pago em uma nova aba
      window.open(paymentUrl, '_blank');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento';
      
      console.error('❌ [VendaLider] Erro no processo de compra em grupo:', {
        error: {
          name: error instanceof Error ? error.name : 'UnknownError',
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        },
        context: {
          quantities,
          totalPrice: getTotalPrice(),
          participantFieldsCount: Object.keys(participantFields).length,
          currentLot: {
            price: currentLot.price,
            name: currentLot.name
          },
          userAgent: navigator.userAgent,
          url: window.location.href
        },
        timestamp: new Date().toISOString()
      });

      // Mensagens de erro mais específicas
      let userFriendlyMessage = 'Erro ao processar pagamento. Tente novamente.';
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        userFriendlyMessage = 'Erro de autenticação. Faça login novamente.';
      } else if (errorMessage.includes('payment') || errorMessage.includes('mercado')) {
        userFriendlyMessage = 'Erro no sistema de pagamento. Tente novamente em alguns minutos.';
      } else if (errorMessage.includes('validation')) {
        userFriendlyMessage = 'Dados inválidos. Verifique as informações dos participantes e tente novamente.';
      } else if (errorMessage.includes('participant') || errorMessage.includes('name')) {
        userFriendlyMessage = 'Erro nos dados dos participantes. Verifique se todos os nomes foram preenchidos corretamente.';
      }
      
      setPaymentError(userFriendlyMessage);
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentModal(false);
    setShowSuccessModal(true);
  };

  const closeModal = () => {
    setShowSizeGuide(false);
    setShowPaymentModal(false);
    setShowSuccessModal(false);
    document.body.style.overflow = 'auto';
  };

  const openModal = () => {
    document.body.style.overflow = 'hidden';
  };

  useEffect(() => {
    if (showSizeGuide || showPaymentModal || showSuccessModal) {
      openModal();
    }
  }, [showSizeGuide, showPaymentModal, showSuccessModal]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#0f2b45] sticky top-0 left-0 right-0 z-40 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-[#edbe66]">
            UMADEPAR 2025
          </Link>
          <div className="flex items-center relative">
            <nav className="hidden md:flex space-x-4 items-center mr-8">
              <Link 
                to="/meus-pedidos" 
                className="bg-transparent text-[#edbe66] border-2 border-[#edbe66] font-bold py-2 px-4 rounded-full hover:bg-[#edbe66] hover:text-[#0f2b45] transition-all duration-300"
              >
                Meus Pedidos
              </Link>
              <Link 
                to="/" 
                className="bg-transparent text-[#edbe66] border-2 border-[#edbe66] font-bold py-2 px-6 rounded-full hover:bg-[#edbe66] hover:text-[#0f2b45] transition-all duration-300"
              >
                Voltar
              </Link>
            </nav>
            {/* Desktop User Profile */}
            <div className="relative hidden md:block">
              <button 
                onClick={toggleUserDropdown}
                title="Área do Usuário" 
                className="flex items-center justify-center w-10 h-10 border-2 border-[#edbe66] rounded-full text-[#edbe66] hover:bg-[#edbe66] hover:text-[#0f2b45] transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Desktop User Dropdown */}
              <div 
                className={`absolute top-full right-0 mt-3 w-64 bg-[#1a374e] rounded-2xl shadow-2xl p-4 text-white transition-all duration-300 ease-out transform origin-top-right z-50 ${
                  isUserDropdownOpen ? 'block' : 'hidden'
                }`}
              >
                {!user ? (
                  <div className="space-y-3">
                    <Link to="/login" className="block w-full text-center px-4 py-3 bg-[#0f2b45] text-white rounded-full hover:bg-[#1a3a5a] transition font-semibold">Entrar Conta</Link>
                    <Link to="/login" className="block w-full text-center px-4 py-3 border border-white text-white rounded-full hover:bg-white hover:text-[#1a374e] transition font-semibold">Criar Conta</Link>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 aspect-square rounded-full bg-[#edbe66] items-center justify-center text-[#0f2b45] font-bold flex-shrink-0 mx-auto mb-3 flex">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <h4 className="font-bold text-center">{userData?.nome || 'Usuário'}</h4>
                      <p className="text-white text-sm text-center">{user.email}</p>
                    </div>
                    <hr className="border-gray-200 mb-4" />
                    <div className="space-y-2">
                      {userData?.tipo === 'admin' && (
                        <Link to="/dashboard-adm" className="block w-full text-left px-4 py-2 rounded-full hover:bg-white/10 transition">Dashboard</Link>
                      )}
                      <Link to="/meus-pedidos" className="block w-full text-left px-4 py-2 rounded-full hover:bg-white/10 transition">Meus Pedidos</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 rounded-full hover:bg-white/10 transition text-red-400">Sair</button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-300 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden px-6 pb-4">
            <Link 
              to="/meus-pedidos" 
              className="block mt-4 w-full text-center bg-transparent text-[#edbe66] border-2 border-[#edbe66] font-bold py-2 px-6 rounded-full"
            >
              Meus Pedidos
            </Link>
            <Link 
              to="/" 
              className="block mt-4 w-full text-center bg-transparent text-[#edbe66] border-2 border-[#edbe66] font-bold py-2 px-6 rounded-full"
            >
              Voltar
            </Link>
            <button className="block mt-4 w-full text-center border-2 border-[#edbe66] text-[#edbe66] font-bold py-2 px-6 rounded-full">
              Área do Usuário
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="text-[#0f2b45]">
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-6">
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl grid md:grid-cols-2 gap-10 md:gap-16 items-start">
              {/* Image Carousel */}
              <div className="w-full">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={images[currentImageIndex]} 
                    alt={`Produto - ${currentImageIndex + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Buttons */}
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#edbe66] hover:text-[#edbe66]/80 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#edbe66] hover:text-[#edbe66]/80 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Pagination Dots */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-[#edbe66]' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Details and Group Order Form */}
              <div className="flex flex-col h-full">
                <h1 className="text-3xl lg:text-4xl font-bold mb-3">Pedido do Grupo</h1>
                
                {/* Preço Atual com Badge do Lote */}
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-2 ${currentLot.bgColor} ${currentLot.textColor} ${currentLot.borderColor} border-2`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    {currentLot.name}
                  </div>
                  <p className="text-3xl font-bold text-[#edbe66] mb-1">
                    R$ {currentLot.price.toFixed(2).replace('.', ',')} <span className="text-lg text-gray-600 font-normal">por camiseta</span>
                  </p>
                  <p className="text-sm text-gray-600">{currentLot.description}</p>
                </div>
                
                <p className="mb-6 text-gray-600">Selecione as quantidades para cada tamanho e informe os nomes dos participantes.</p>
                
                {/* Indicador de dados recuperados */}
                {isDataRecovered && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Dados do pedido em grupo recuperados automaticamente! Suas quantidades e participantes foram mantidos.</span>
                  </div>
                )}
                
                <div className="flex-grow space-y-3">
                  {sizes.map((size) => (
                    <div key={size} className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">Tamanho {size}</span>
                          {quantities[size] > 0 && (
                            <button 
                              onClick={() => toggleParticipantsVisibility(size)}
                              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                              title="Mostrar/Ocultar nomes"
                            >
                              <svg 
                                className={`w-4 h-4 transition-transform duration-300 ${
                                  showParticipants[size] ? 'rotate-180' : ''
                                }`} 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center">
                          <button 
                            onClick={() => updateQuantity(size, 'decrease')}
                            className="text-gray-600 hover:text-gray-800 transition-colors text-lg font-bold border border-gray-300 rounded-full mr-2 w-8 h-8 flex items-center justify-center"
                          >-</button>
                          <div className="border border-gray-300 rounded-full px-4">
                            <input 
                              type="number" 
                              value={quantities[size]} 
                              onChange={(e) => setQuantityDirect(size, parseInt(e.target.value) || 0)}
                              className="w-8 text-center text-sm font-bold bg-transparent focus:outline-none"
                              min="0"
                            />
                          </div>
                          <button 
                            onClick={() => updateQuantity(size, 'increase')}
                            className="text-gray-600 hover:text-gray-800 transition-colors text-lg font-bold border border-gray-300 rounded-full ml-2 w-8 h-8 flex items-center justify-center"
                          >+</button>
                        </div>
                      </div>
                      
                      {/* Participant Names */}
                      {quantities[size] > 0 && (
                        <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border">
                          <h4 className="font-semibold text-gray-700 flex items-center text-sm">
                            <span className="bg-[#edbe66] text-white px-1.5 py-0.5 rounded-full text-xs mr-2">{quantities[size]}</span>
                            Participantes - Tamanho {size}
                          </h4>
                          {participantFields[size].map((field, index) => (
                            <div key={field.id} className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-gray-600 w-5 h-5 bg-white rounded-full flex items-center justify-center border">{index + 1}</span>
                              <div className="flex-1">
                                <input 
                                  type="text" 
                                  placeholder={`Nome do Participante ${index + 1} - Tamanho ${size}`}
                                  value={field.name}
                                  onChange={(e) => updateParticipantName(size, index, e.target.value)}
                                  data-field-id={field.id}
                                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#edbe66] focus:border-transparent transition-all" 
                                  required 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-auto pt-6">
                  <button 
                    onClick={() => setShowSizeGuide(true)}
                    className="text-sm text-gray-600 hover:text-[#0f2b45] underline inline-flex items-center gap-1 mb-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Guia de tamanhos
                  </button>
                  
                  {getTotalQuantity() > 0 && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-[#edbe66]/10 to-[#edbe66]/5 rounded-xl border-2 border-[#edbe66]/20">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumo do Pedido</h3>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600">Quantidade total:</span>
                          <span className="font-bold text-xl text-gray-800">{getTotalQuantity()} camisetas</span>
                        </div>
                        
                        {/* Detalhamento por tamanho */}
                        {getTotalQuantity() > 0 && (
                          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Detalhamento:</div>
                            <div className="grid grid-cols-2 gap-1 text-xs text-gray-700">
                               {Object.entries(quantities).map(([size, qty]) => (
                                 qty > 0 && (
                                   <div key={size} className="flex items-center gap-1">
                                     <span>{size}: {qty} camiseta{qty > 1 ? 's' : ''}</span>
                                   </div>
                                 )
                               ))}
                             </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600">Preço unitário:</span>
                          <span className="font-semibold text-lg text-gray-700">R$ {currentLot.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="border-t-2 border-[#edbe66]/30 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-800">Total:</span>
                            <span className="font-black text-3xl text-[#edbe66] drop-shadow-sm">R$ {getTotalPrice().toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleBuyClick}
                    disabled={getTotalQuantity() === 0 || isProcessingPayment}
                    className="bg-[#edbe66] text-[#0f2b45] w-full font-bold py-4 px-10 rounded-full text-lg hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-[#0f2b45] border-t-transparent rounded-full animate-spin"></div>
                        Processando...
                      </div>
                    ) : getTotalQuantity() === 0 ? 'Adicione camisetas' : 'Comprar'}
                  </button>
                  
                  {paymentError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                      <strong>Erro:</strong> {paymentError}
                      <button 
                        onClick={() => setPaymentError(null)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cronograma de Preços */}
        <section className="py-8">
          <div className="container mx-auto px-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold mb-3 text-[#0f2b45]">📅 Cronograma de Preços</h3>
              <div className="grid gap-3">
                {getAllLots().map((lot) => (
                  <div 
                     key={lot.number}
                     className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                       lot.status === 'active' 
                         ? `${lot.bgColor} ${lot.borderColor} shadow-md` 
                         : lot.status === 'expired'
                         ? 'bg-gray-100 border-gray-300 opacity-60'
                         : 'bg-gray-50 border-gray-200'
                     }`}
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                           lot.status === 'active' ? 'bg-green-500' :
                           lot.status === 'expired' ? 'bg-gray-400' : 'bg-gray-300'
                         }`}>
                           {lot.number}
                         </span>
                         <div>
                           <p className={`font-bold text-xs ${
                             lot.status === 'active' ? lot.textColor : 'text-gray-600'
                           }`}>
                             {lot.name}
                           </p>
                           <p className="text-xs text-gray-500">{lot.description}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className={`font-bold text-sm ${
                           lot.status === 'active' ? 'text-[#edbe66]' : 'text-gray-600'
                         }`}>
                           R$ {lot.price.toFixed(2).replace('.', ',')}
                         </p>
                         {lot.status === 'active' && (
                           <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                             ATIVO
                           </span>
                         )}
                         {lot.status === 'expired' && (
                           <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded-full">
                             EXPIRADO
                           </span>
                         )}
                         {lot.status === 'upcoming' && (
                           <span className="text-xs bg-blue-400 text-white px-1.5 py-0.5 rounded-full">
                             EM BREVE
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f2b45] border-t border-[#edbe66]/20 py-12">
        <div className="container mx-auto px-6 text-center text-gray-300">
          <p className="font-bold text-xl mb-2 text-[#edbe66]">UMADEPAR 2025</p>
          <p>&copy; 2025 União da Mocidade da Assembleia de Deus no Estado do Paraná. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#0f2b45] p-8 rounded-2xl shadow-2xl w-full max-w-lg relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-800"
            >
              &times;
            </button>
            <h4 className="text-2xl font-bold mb-6 text-center">Guia de Tamanhos</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 font-bold">Tamanho</th>
                    <th className="p-2 font-bold">Largura (cm)</th>
                    <th className="p-2 font-bold">Altura (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-2">P</td><td className="p-2">50</td><td className="p-2">68</td></tr>
                  <tr className="border-b"><td className="p-2">M</td><td className="p-2">52</td><td className="p-2">70</td></tr>
                  <tr className="border-b"><td className="p-2">G</td><td className="p-2">54</td><td className="p-2">72</td></tr>
                  <tr className="border-b"><td className="p-2">GG</td><td className="p-2">56</td><td className="p-2">74</td></tr>
                  <tr className="border-b"><td className="p-2">XG</td><td className="p-2">58</td><td className="p-2">76</td></tr>
                  <tr className="border-b"><td className="p-2">XXG</td><td className="p-2">60</td><td className="p-2">78</td></tr>
                  <tr className="border-b"><td className="p-2">E1</td><td className="p-2">62</td><td className="p-2">80</td></tr>
                  <tr><td className="p-2">E2</td><td className="p-2">64</td><td className="p-2">82</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4">*Medidas aproximadas. Pode haver variação de até 2cm.</p>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#0f2b45] p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-800"
            >
              &times;
            </button>
            <h4 className="text-2xl font-bold mb-6 text-center">Informações de Pagamento</h4>
            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block font-bold mb-2">Nome Completo do Líder</label>
                <input 
                  type="text" 
                  id="name" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#edbe66] focus:border-transparent" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block font-bold mb-2">E-mail</label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#edbe66] focus:border-transparent" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="card" className="block font-bold mb-2">Número do Cartão</label>
                <input 
                  type="text" 
                  id="card" 
                  placeholder="0000 0000 0000 0000" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#edbe66] focus:border-transparent" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="expiry" className="block font-bold mb-2">Validade</label>
                  <input 
                    type="text" 
                    id="expiry" 
                    placeholder="MM/AA" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#edbe66] focus:border-transparent" 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="cvc" className="block font-bold mb-2">CVC</label>
                  <input 
                    type="text" 
                    id="cvc" 
                    placeholder="123" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#edbe66] focus:border-transparent" 
                    required 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="bg-[#edbe66] text-[#0f2b45] w-full font-bold py-4 px-10 rounded-full text-lg hover:brightness-110 transition-all duration-300"
              >
                Finalizar Compra
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-[#0f2b45] p-8 rounded-2xl shadow-2xl text-center max-w-sm">
            <h3 className="text-2xl font-bold mb-4 text-[#edbe66]">Compra Realizada!</h3>
            <p className="mb-6">Obrigado! Você receberá um e-mail de confirmação em breve.</p>
            <button 
              onClick={closeModal}
              className="bg-[#edbe66] text-[#0f2b45] font-bold py-2 px-8 rounded-full hover:brightness-110 transition-all duration-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendaLider;