import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrderService } from '../services/orderService';
import { useSizeSelectionPersistence } from '../hooks/useFormPersistence';
import { useAuth } from '../contexts/AuthContext';

const VendaJovem: React.FC = () => {
  // Persistência de dados do formulário
  const {
    data: selectionData,
    setData: setSelectionData,
    isDataRecovered,
    handleSuccessfulSubmit
  } = useSizeSelectionPersistence();
  
  const { user, userData, signOut, forceLogout, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  
  const selectedSize = selectionData.selectedSize;
  const quantity = selectionData.quantity;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Efeito para detectar logout e garantir limpeza completa
  useEffect(() => {
    // Se não há usuário e não está carregando, garantir que menus estejam fechados
    if (!user && !loading) {
      setIsUserDropdownOpen(false);
      
      // Verificar se há parâmetro de logout na URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('logout')) {
        console.log('🔄 [VendaJovem] Logout detectado via URL, limpando cache adicional...');
        
        // Limpar qualquer cache residual
        try {
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }
        } catch (cacheError) {
          console.warn('⚠️ [VendaJovem] Erro ao limpar cache:', cacheError);
        }
        
        // Remover parâmetro da URL sem recarregar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user, loading]);

  // Efeito para recuperar userData quando user existe mas userData é null
  useEffect(() => {
    if (user && !userData && !loading) {
      console.log('🔄 [VendaJovem] Usuário logado sem userData detectado, tentando recuperar...');
      
      // Tentar recuperar a sessão para recarregar userData
      const timer = setTimeout(() => {
        console.log('🔄 [VendaJovem] Executando refreshSession para recuperar userData...');
        refreshSession();
      }, 1000); // Aguardar 1 segundo para evitar loops
      
      return () => clearTimeout(timer);
    }
  }, [user, userData, loading, refreshSession]);

  const handleLogout = async () => {
    console.log('🚨 [VendaJovem] Iniciando logout avançado...');
    
    // Fechar todos os menus imediatamente
    setIsUserDropdownOpen(false);
    
    try {
      // Usar a função de logout forçado do contexto
      await forceLogout();
      
      console.log('✅ [VendaJovem] Logout forçado concluído');
      
      // Limpar cache do navegador e cookies relacionados ao Supabase
      try {
        // Limpar cookies do Supabase
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('supabase') || name.includes('sb-')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
        console.log('🍪 [VendaJovem] Cookies do Supabase limpos');
      } catch (cookieError) {
        console.warn('⚠️ [VendaJovem] Erro ao limpar cookies:', cookieError);
      }
      
      // Forçar limpeza do cache do Service Worker se existir
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          console.log('🔧 [VendaJovem] Service Workers limpos');
        } catch (swError) {
          console.warn('⚠️ [VendaJovem] Erro ao limpar Service Workers:', swError);
        }
      }
      
      // Aguardar um pouco e forçar reload com cache busting
      setTimeout(() => {
        // Adicionar timestamp para evitar cache e forçar reload completo
        const timestamp = Date.now();
        const currentUrl = window.location.origin;
        window.location.href = `${currentUrl}/?logout=${timestamp}`;
      }, 300);
      
    } catch (error) {
      console.error('❌ [VendaJovem] Erro durante logout avançado:', error);
      
      // Fallback: limpeza manual e redirecionamento forçado
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpar cookies manualmente
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        
        console.log('🔄 [VendaJovem] Fallback: limpeza manual concluída');
      } catch (fallbackError) {
        console.error('❌ [VendaJovem] Erro no fallback:', fallbackError);
      }
      
      // Redirecionamento forçado mesmo com erro
      setTimeout(() => {
        const timestamp = Date.now();
        window.location.href = `/?t=${timestamp}`;
      }, 200);
    }
  };

  const toggleUserDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById('userProfileDropdown');
      const icon = document.getElementById('user-profile-icon');
      
      if (isUserDropdownOpen && dropdown && icon && 
          !dropdown.contains(e.target as Node) && 
          !icon.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isUserDropdownOpen]);

  // Sistema de Lotes
  const getCurrentLot = () => {
    const now = new Date();
    const october31 = new Date(2025, 9, 31); // 31 de outubro de 2025
    const eventDate = new Date(2025, 11, 15); // 15 de dezembro de 2025
    const twentyDaysBefore = new Date(eventDate.getTime() - (20 * 24 * 60 * 60 * 1000)); // 20 dias antes

    if (now <= october31) {
      return {
        number: 1,
        name: '1º Lote - Promoção Especial',
        price: 2.00,
        description: 'Válido até 31 de outubro de 2025',
        status: 'active',
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      };
    } else if (now <= twentyDaysBefore) {
      return {
        number: 2,
        name: '2º Lote - Últimas Semanas',
        price: 45.00,
        description: 'Válido até 25 de novembro de 2025',
        status: 'active',
        color: 'from-yellow-500 to-orange-500',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
      };
    } else {
      return {
        number: 3,
        name: '3º Lote - No Local do Evento',
        price: 50.00,
        description: 'Disponível apenas no dia 15 de dezembro de 2025',
        status: 'event-only',
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      };
    }
  };

  const currentLot = getCurrentLot();

  const getAllLots = () => [
    {
      number: 1,
      name: '1º Lote - Promoção Especial',
      price:2.00,
      description: 'Até 31/10/2025',
      status: currentLot.number === 1 ? 'active' : currentLot.number > 1 ? 'expired' : 'upcoming',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200'
    },
    {
      number: 2,
      name: '2º Lote - Últimas Semanas',
      price: 45.00,
      description: 'Nov até 25/11/2025',
      status: currentLot.number === 2 ? 'active' : currentLot.number > 2 ? 'expired' : 'upcoming',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    {
      number: 3,
      name: '3º Lote - No Local',
      price: 50.00,
      description: 'Apenas no dia do evento',
      status: currentLot.number === 3 ? 'active' : 'upcoming',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    }
  ];

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

  const handleSizeSelect = (size: string) => {
    setSelectionData(prev => ({ ...prev, selectedSize: size }));
  };

  const increaseQuantity = () => {
    setSelectionData(prev => ({ ...prev, quantity: prev.quantity + 1 }));
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setSelectionData(prev => ({ ...prev, quantity: prev.quantity - 1 }));
    }
  };

  const handleBuyClick = async () => {
    if (!selectedSize) {
      alert('Por favor, selecione um tamanho.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      setIsProcessingPayment(true);
      setPaymentError('');

      console.log('🛒 [VendaJovem] Iniciando processo de compra:', {
        selectedSize,
        quantity,
        currentLot: {
          price: currentLot.price,
          name: currentLot.name
        },
        timestamp: new Date().toISOString()
      });

      // Cria o pedido e inicia o pagamento
      const paymentUrl = await OrderService.createOrderAndStartPayment({
        tipo_pedido: 'individual',
        valor_total: currentLot.price,
        observacoes: `Tamanho: ${selectedSize}, Quantidade: ${quantity}`,
        itens: [{
          tamanho: selectedSize,
          quantidade: quantity,
          preco_unitario: currentLot.price
        }]
      });

      console.log('✅ [VendaJovem] Pagamento criado com sucesso:', {
        paymentUrl,
        timestamp: new Date().toISOString()
      });

      // Limpa os dados persistidos após sucesso
      handleSuccessfulSubmit();

      // Abre o checkout do Mercado Pago em uma nova aba
      window.open(paymentUrl, '_blank');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao processar pagamento';
      
      console.error('❌ [VendaJovem] Erro no processo de compra:', {
        error: {
          name: error instanceof Error ? error.name : 'UnknownError',
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        },
        context: {
          selectedSize,
          quantity,
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
        userFriendlyMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
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
              >Meus Pedidos</Link>
              <Link 
                to="/" 
                className="bg-transparent text-[#edbe66] border-2 border-[#edbe66] font-bold py-2 px-6 rounded-full hover:bg-[#edbe66] hover:text-[#0f2b45] transition-all duration-300"
              >
                Voltar
              </Link>
            </nav>
            <button 
              id="user-profile-icon"
              onClick={toggleUserDropdown}
              title="Área do Usuário" 
              className="hidden md:flex items-center justify-center w-10 h-10 border-2 border-[#edbe66] rounded-full text-[#edbe66] hover:bg-[#edbe66] hover:text-[#0f2b45] transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* User Dropdown */}
            <div 
              id="userProfileDropdown"
              className={`absolute top-full right-0 mt-3 w-64 bg-[#1a374e] rounded-2xl shadow-2xl p-4 text-white transition-all duration-300 ease-out transform origin-top-right z-50 ${
                isUserDropdownOpen ? 'block' : 'hidden'
              }`}
            >
              {!user ? (
                <div className="space-y-3">
                  <a href="/login" className="block w-full text-center px-4 py-3 bg-[#0f2b45] text-white rounded-full hover:bg-[#1a3a5a] transition font-semibold">Entrar Conta</a>
                  <a href="/login" className="block w-full text-center px-4 py-3 border border-white text-white rounded-full hover:bg-white hover:text-[#1a374e] transition font-semibold">Criar Conta</a>
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

              {/* Product Details */}
              <div className="flex flex-col h-full">
                <h1 className="text-3xl lg:text-4xl font-bold mb-3">Camiseta Oficial UMADEPAR 2025</h1>
                
                {/* Preço Atual com Badge do Lote */}
                <div className="mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold mb-2 ${currentLot.bgColor} ${currentLot.textColor} ${currentLot.borderColor} border-2`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    {currentLot.name}
                  </div>
                  <p className="text-4xl font-bold text-[#edbe66] mb-1">
                    R$ {currentLot.price.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-sm text-gray-600">{currentLot.description}</p>
                </div>
                
                <p className="mb-6 text-gray-600">Malha de alta qualidade, não encolhe e não desbota. Estoque limitado!</p>

                {/* Size Selection */}
                 <div className="mt-auto">
                   <div className="mb-6">
                    <label className="block font-bold mb-3 text-lg">Tamanho:</label>
                    <div className="flex flex-wrap gap-3">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          className={`p-3 px-5 rounded-lg font-semibold border-2 transition-all duration-200 ${
                            selectedSize === size
                              ? 'border-[#0f2b45] bg-[#0f2b45] text-white'
                              : 'border-gray-300 hover:border-[#0f2b45]'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowSizeGuide(true)}
                      className="text-sm text-gray-600 hover:text-[#0f2b45] underline mt-3 inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Guia de tamanhos
                    </button>
                  </div>
                  
                  {/* Quantity Selection */}
                  <div className="mb-8">
                    <label className="block font-bold mb-3 text-lg">Quantidade:</label>
                    <div className="flex items-center">
                      <button 
                        onClick={decreaseQuantity}
                        className="border-2 rounded-md p-2 px-4 font-bold text-xl hover:bg-gray-50"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        value={quantity} 
                        readOnly
                        className="w-20 text-center text-lg font-bold border-t-2 border-b-2 h-full"
                      />
                      <button 
                        onClick={increaseQuantity}
                        className="border-2 rounded-md p-2 px-4 font-bold text-xl hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Indicador de dados recuperados */}
                  {isDataRecovered && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Dados recuperados automaticamente! Sua seleção anterior foi mantida.</span>
                    </div>
                  )}

                  {/* Resumo do Pedido */}
                  {selectedSize && quantity > 0 && (
                    <div className="mb-6 p-6 bg-gradient-to-r from-[#edbe66]/10 to-[#edbe66]/5 rounded-xl border-2 border-[#edbe66]/20">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Resumo do Pedido</h3>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600">Quantidade:</span>
                          <span className="font-bold text-xl text-gray-800">{quantity} camiseta{quantity > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600">Tamanho:</span>
                          <span className="font-bold text-xl text-gray-800">{selectedSize}</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-600">Preço unitário:</span>
                          <span className="font-semibold text-lg text-gray-700">R$ {currentLot.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="border-t-2 border-[#edbe66]/30 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-800">Total:</span>
                            <span className="font-black text-3xl text-[#edbe66] drop-shadow-sm">R$ {(currentLot.price * quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buy Button */}
                  {currentLot.status === 'event-only' ? (
                    <div className="w-full">
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold">Compra Apenas no Local</span>
                        </div>
                        <p className="text-sm text-red-600 mt-2">
                           Este lote estará disponível apenas no dia do evento (15 de dezembro de 2025) no local do UMADEPAR 2025.
                         </p>
                      </div>
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-lg cursor-not-allowed"
                      >
                        Disponível apenas no evento
                      </button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <button
                        onClick={handleBuyClick}
                        disabled={!selectedSize || isProcessingPayment}
                        className="bg-[#edbe66] text-[#0f2b45] w-full font-bold py-4 px-10 rounded-full text-lg hover:brightness-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessingPayment ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-[#0f2b45] border-t-transparent rounded-full animate-spin"></div>
                            Processando...
                          </div>
                        ) : !selectedSize ? 'Selecione um tamanho' : 'Comprar'}
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
                <label htmlFor="name" className="block font-bold mb-2">Nome Completo</label>
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

export default VendaJovem;