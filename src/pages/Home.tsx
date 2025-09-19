import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useAuth } from '../contexts/AuthContext';

// Componente de Contagem Regressiva
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2025-11-01T19:00:00-03:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
      <div className="bg-[#0f2b45] backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#edbe66]/30 shadow-lg">
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#edbe66] mb-2">
          {timeLeft.days.toString().padStart(2, '0')}
        </div>
        <div className="text-sm sm:text-base md:text-lg font-semibold text-white uppercase tracking-wider">
          Dias
        </div>
      </div>
      
      <div className="bg-[#0f2b45] backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#edbe66]/30 shadow-lg">
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#edbe66] mb-2">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-sm sm:text-base md:text-lg font-semibold text-white uppercase tracking-wider">
          Horas
        </div>
      </div>
      
      <div className="bg-[#0f2b45] backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#edbe66]/30 shadow-lg">
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#edbe66] mb-2">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-sm sm:text-base md:text-lg font-semibold text-white uppercase tracking-wider">
          Minutos
        </div>
      </div>
      
      <div className="bg-[#0f2b45] backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#edbe66]/30 shadow-lg">
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#edbe66] mb-2">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-sm sm:text-base md:text-lg font-semibold text-white uppercase tracking-wider">
          Segundos
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const { user, userData, signOut, forceLogout, loading, refreshSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });

    const handleScroll = () => {
      const header = document.getElementById('header');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('py-2', 'shadow-lg');
          header.classList.remove('py-4');
        } else {
          header.classList.remove('py-2', 'shadow-lg');
          header.classList.add('py-4');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efeito para detectar logout e garantir limpeza completa
  useEffect(() => {
    // Se não há usuário e não está carregando, garantir que menus estejam fechados
    if (!user && !loading) {
      setIsUserDropdownOpen(false);
      setIsMobileMenuOpen(false);
      
      // Verificar se há parâmetro de logout na URL
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('logout')) {
        console.log('🔄 [Home] Logout detectado via URL, limpando cache adicional...');
        
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
          console.warn('⚠️ [Home] Erro ao limpar cache:', cacheError);
        }
        
        // Remover parâmetro da URL sem recarregar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user, loading]);

  // Efeito para recuperar userData quando user existe mas userData é null
  useEffect(() => {
    if (user && !userData && !loading) {
      console.log('🔄 [Home] Usuário logado sem userData detectado, tentando recuperar...');
      
      // Tentar recuperar a sessão para recarregar userData
      const timer = setTimeout(() => {
        console.log('🔄 [Home] Executando refreshSession para recuperar userData...');
        refreshSession();
      }, 1000); // Aguardar 1 segundo para evitar loops
      
      return () => clearTimeout(timer);
    }
  }, [user, userData, loading, refreshSession]);

  const openModal = (src: string) => {
    setModalImageSrc(src);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalImageSrc('');
    document.body.style.overflow = 'auto';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    console.log('🚨 [Home] Iniciando logout avançado...');
    
    // Fechar todos os menus imediatamente
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
    
    try {
      // Usar a função de logout forçado do contexto
      await forceLogout();
      
      console.log('✅ [Home] Logout forçado concluído');
      
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
        console.log('🍪 [Home] Cookies do Supabase limpos');
      } catch (cookieError) {
        console.warn('⚠️ [Home] Erro ao limpar cookies:', cookieError);
      }
      
      // Forçar limpeza do cache do Service Worker se existir
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          console.log('🔧 [Home] Service Workers limpos');
        } catch (swError) {
          console.warn('⚠️ [Home] Erro ao limpar Service Workers:', swError);
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
      console.error('❌ [Home] Erro durante logout avançado:', error);
      
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
        
        console.log('🔄 [Home] Fallback: limpeza manual concluída');
      } catch (fallbackError) {
        console.error('❌ [Home] Erro no fallback:', fallbackError);
      }
      
      // Redirecionamento forçado mesmo com erro
      setTimeout(() => {
        const timestamp = Date.now();
        window.location.href = `/?t=${timestamp}`;
      }, 200);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleUserDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById('userProfileDropdown');
      const mobileDropdown = document.getElementById('mobileUserProfileDropdown');
      const icon = document.getElementById('user-profile-icon');
      const mobileIcon = document.getElementById('mobile-user-profile-icon');
      
      if (isUserDropdownOpen && dropdown && mobileDropdown && icon && mobileIcon && 
          !dropdown.contains(e.target as Node) && 
          !mobileDropdown.contains(e.target as Node) &&
          !icon.contains(e.target as Node) &&
          !mobileIcon.contains(e.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [isUserDropdownOpen]);

  return (
    <div className="antialiased bg-[#0f2b45] text-[#d9d9d9] font-['Inter',sans-serif] scroll-smooth overflow-x-hidden">
      {/* Header */}
      <header 
        id="header" 
        className="bg-[#0f2b45]/95 backdrop-blur-lg fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      >
        <div className="container mx-auto px-4 sm:px-6">
          {/* Desktop and Mobile Header */}
          <div className="flex justify-between items-center py-4">
            {/* Mobile Menu Button - Left side */}
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden text-[#d9d9d9] focus:outline-none p-2"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {/* Logo/Title - Hidden on mobile */}
            <h1 className="hidden md:block text-xl sm:text-2xl font-bold text-[#edbe66]">UMADEPAR 2025</h1>
            
            {/* Mobile User Profile - Right side */}
            <div className="md:hidden relative">
              <button 
                id="mobile-user-profile-icon"
                onClick={toggleUserDropdown}
                title="Área do Usuário" 
                className="flex items-center justify-center w-10 h-10 border-2 border-[#edbe66] rounded-full text-[#edbe66] hover:bg-[#edbe66] hover:text-[#0f2b45] transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Mobile User Dropdown */}
              <div 
                id="mobileUserProfileDropdown"
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
                      <h4 className="font-bold text-center">{user.user_metadata?.name || 'Usuário'}</h4>
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
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-8 items-center">
                <a href="#sobre" className="text-[#d9d9d9] hover:text-[#edbe66] transition">Sobre</a>
                <a href="#lideres" className="text-[#d9d9d9] hover:text-[#edbe66] transition">Líderes</a>
                <a href="#camisetas" className="text-[#d9d9d9] hover:text-[#edbe66] transition">Camisetas</a>
                <a href="#fotos" className="text-[#d9d9d9] hover:text-[#edbe66] transition">Fotos</a>
                <a href="#adquirir" className="bg-[#edbe66] text-[#0f2b45] font-bold py-2 px-6 rounded-full transition-all duration-300 shadow-[0_4px_15px_rgba(237,190,102,0.2)] hover:transform hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(237,190,102,0.4)]">Comprar Agora</a>
              </nav>
              
              {/* Desktop User Profile */}
              <div className="relative">
                <button 
                  id="user-profile-icon"
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
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="py-4 border-t border-[#edbe66]/20">
              <nav className="space-y-2">
                <a href="#sobre" onClick={closeMobileMenu} className="block py-3 px-4 text-[#d9d9d9] hover:text-[#edbe66] hover:bg-[#edbe66]/10 rounded-lg transition">Sobre</a>
                <a href="#lideres" onClick={closeMobileMenu} className="block py-3 px-4 text-[#d9d9d9] hover:text-[#edbe66] hover:bg-[#edbe66]/10 rounded-lg transition">Líderes</a>
                <a href="#camisetas" onClick={closeMobileMenu} className="block py-3 px-4 text-[#d9d9d9] hover:text-[#edbe66] hover:bg-[#edbe66]/10 rounded-lg transition">Camisetas</a>
                <a href="#fotos" onClick={closeMobileMenu} className="block py-3 px-4 text-[#d9d9d9] hover:text-[#edbe66] hover:bg-[#edbe66]/10 rounded-lg transition">Fotos</a>
                
                <div className="pt-4">
                  <a href="#adquirir" onClick={closeMobileMenu} className="block w-full text-center bg-[#edbe66] text-[#0f2b45] font-bold py-3 px-6 rounded-full transition-all duration-300">Comprar Agora</a>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        id="hero" 
        className="min-h-screen flex items-center justify-center text-center bg-[#0f2b45] relative pt-20 md:pt-0"
        style={{
          backgroundImage: 'url("https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/fotoCapa.webp")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply'
        }}
      >
        <div className="absolute inset-0 bg-[#0f2b45] opacity-60"></div>
        <div className="relative z-10 px-4 sm:px-6 py-8" data-aos="fade-up">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white leading-tight mb-4">
            UMADEPAR <span className="text-[#edbe66] block sm:inline">9ª REGIÃO</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-[#d9d9d9] mt-4 mb-8 max-w-3xl mx-auto leading-relaxed">Um tempo de renovo, propósito e união para a juventude que serve a Deus no Paraná.</p>
          <a href="#adquirir" className="inline-block bg-[#edbe66] text-[#0f2b45] font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-full text-base sm:text-lg transition-all duration-300 shadow-[0_4px_15px_rgba(237,190,102,0.2)] hover:transform hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(237,190,102,0.4)]">Garanta sua Camiseta</a>
        </div>
      </section>

      <main>
        {/* Seção Sobre o Evento */}
        <section id="sobre" className="py-12 sm:py-16 md:py-20 lg:py-32 bg-[#d9d9d9] text-[#0f2b45]">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-[1px] sm:tracking-[2px] mb-4 text-[#0f2b45]" data-aos="fade-up">O Evento</h3>
            <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed mb-8 sm:mb-12" data-aos="fade-up" data-aos-delay="100">A UMADEPAR 9ª Região realiza o seu congresso de jovens em um grande dia de celebração. Será um tempo de louvor, adoração, palavra e comunhão, onde cremos que Deus nos conduzirá a um verdadeiro tempo de glória, marcando esta geração e fortalecendo o chamado de Cristo em nossos dias.</p>
            
            {/* Cards de Informações do Evento */}
            <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-4 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="200">
              
              {/* Card Data e Horário */}
              <div className="bg-white p-4 rounded-2xl text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-[#edbe66] mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-lg font-bold text-[#0f2b45]">Data e Horário</h4>
                </div>
                <p className="text-base font-semibold text-[#0f2b45]">1 de Novembro de 2025</p>
                <p className="text-sm text-gray-600">Sábado • 19h00</p>
              </div>

              {/* Card Localização */}
              <div className="bg-white p-4 rounded-2xl text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-[#edbe66] mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-lg font-bold text-[#0f2b45]">Localização</h4>
                </div>
                <p className="text-base font-semibold text-[#0f2b45]">Centro de Eventos</p>
                <p className="text-sm text-gray-600">UMUARAMA-PR</p>
              </div>
              
            </div>
            
            {/* Contagem Regressiva */}
            <div className="mt-12 sm:mt-16" data-aos="fade-up" data-aos-delay="300">
              <h4 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-[1px] sm:tracking-[2px] mb-8 text-[#0f2b45]">
                Faltam apenas
              </h4>
              
              <div className="max-w-4xl mx-auto">
                <CountdownTimer />
              </div>
              
              <p className="text-base sm:text-lg text-[#0f2b45] mt-6 max-w-2xl mx-auto font-medium">
                Para o maior congresso de jovens da UMADEPAR 9ª Região!
              </p>
            </div>
          </div>
        </section>

        {/* Seção Diretoria e Líderes */}
        <section id="lideres" className="py-12 sm:py-16 md:py-20 lg:py-32 bg-[#0f2b45]">
          <div className="flex flex-col items-center w-full min-h-screen py-16 px-4 sm:px-8 md:px-16 lg:px-24">
            
            {/* Content Wrapper */}
            <div className="flex flex-col items-center justify-center w-full max-w-6xl gap-16 md:gap-20">

              {/* Title: DIRETORIA 9ª REGIÃO */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center uppercase tracking-[2px] text-white" data-aos="fade-up">DIRETORIA 9ª REGIÃO ECLESIÁSTICA</h1>

              {/* President Section */}
              <section className="flex flex-col lg:flex-row items-center w-full gap-8 md:gap-12" data-aos="fade-up" data-aos-delay="100">
                {/* President's Photo */}
                <div className="w-full lg:w-1/2">
                  <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/Perci.webp" alt="Foto do Pastor Presidente" className="w-full h-auto object-cover rounded-2xl shadow-2xl" />
                </div>
                {/* President's Quote and Info */}
                <div className="flex flex-col justify-center w-full lg:w-1/2 gap-8">
                  <p className="text-2xl italic font-light text-[#d9d9d9]">
                    "Nossa oração é que cada jovem saia deste congresso com o coração ardendo e a fé renovada para ser um agente de transformação nesta geração."
                  </p>
                  <div>
                    <h3 className="text-xl font-bold uppercase text-[#edbe66]">
                      Pr. Perci Fontoura
                    </h3>
                    <p className="text-lg uppercase text-[#d9d9d9]">
                      Presidente da CIEADEP
                    </p>
                  </div>
                </div>
              </section>

              {/* Directors Row 1 */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 md:gap-8 w-full justify-items-center" data-aos="fade-up" data-aos-delay="200">
                {/* Profile Card 1 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/PAULO%20BONARI.png" alt="Foto do Pr. Paulo Bonari" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-base md:text-lg font-bold uppercase text-[#edbe66] leading-tight">PR. PAULO BONARI</h4>
                    <p className="text-xs md:text-sm uppercase text-[#d9d9d9] leading-tight mt-1">coordenador cieadep 9ª região</p>
                  </div>
                </div>
                {/* Profile Card 2 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/THIAGO%20FRANCO.png" alt="Foto do Pr. Thiago Franco" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-base md:text-lg font-bold uppercase text-[#edbe66] leading-tight">Pr. Thiago Franco</h4>
                    <p className="text-xs md:text-sm uppercase text-[#d9d9d9] leading-tight mt-1">vice-coord. cieadep 9ª região</p>
                  </div>
                </div>
                {/* Profile Card 3 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/ANDREY%20MACHADO.png" alt="Foto do PR. Andrey Machado" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-base md:text-lg font-bold uppercase text-[#edbe66] leading-tight">PR. Andrey Machado</h4>
                    <p className="text-xs md:text-sm uppercase text-[#d9d9d9] leading-tight mt-1">relator cieadep 9ª região</p>
                  </div>
                </div>
                {/* Profile Card 4 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/LUCIANO%20CAMARGO.png" alt="Foto do PR. luciano camargo" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-base md:text-lg font-bold uppercase text-[#edbe66] leading-tight">PR. luciano camargo</h4>
                    <p className="text-xs md:text-sm uppercase text-[#d9d9d9] leading-tight mt-1">tesoureiro cieadep 9ª região</p>
                  </div>
                </div>
              </section>

              {/* Title: PALAVRA DOS LÍDERES */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center uppercase tracking-[2px] text-white" data-aos="fade-up" data-aos-delay="300">
                Palavra dos líderes
              </h2>

              {/* YouTube Video */}
              <div className="w-full h-64 md:h-96 lg:h-[600px] bg-white rounded-3xl overflow-hidden" data-aos="fade-up" data-aos-delay="400">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/7lDdyeLhwec"
                  title="UMADEPAR 2022 | Pastor Ney Silva | Coordenador Geral"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Title: LÍDERES DOS SETORES */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center uppercase tracking-[2px] text-white" data-aos="fade-up" data-aos-delay="500">
                líderes dos setores umadepar 9ª Região
              </h2>

              {/* Directors Row 2 */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6 md:gap-8 w-full justify-items-center mx-auto max-w-6xl px-4" data-aos="fade-up" data-aos-delay="600">
                {/* Profile Card 1 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://placehold.co/288x294/E0E8FA/0F2B45?text=Foto" alt="Foto do Pr. Carlos Israel" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-sm md:text-base font-bold uppercase text-[#edbe66] leading-tight">Pr. Carlos Israel</h4>
                    <p className="text-xs uppercase text-[#d9d9d9] leading-tight mt-1">Líder Setor 1</p>
                  </div>
                </div>
                {/* Profile Card 2 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://placehold.co/288x294/E0E8FA/0F2B45?text=Foto" alt="Foto do Pr. Eder Moraes" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-sm md:text-base font-bold uppercase text-[#edbe66] leading-tight">Pr. Eder Moraes</h4>
                    <p className="text-xs uppercase text-[#d9d9d9] leading-tight mt-1">Líder Setor 2</p>
                  </div>
                </div>
                {/* Profile Card 3 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://placehold.co/288x294/E0E8FA/0F2B45?text=Foto" alt="Foto do Ev. Lucas Nathan" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-sm md:text-base font-bold uppercase text-[#edbe66] leading-tight">Ev. Lucas Nathan</h4>
                    <p className="text-xs uppercase text-[#d9d9d9] leading-tight mt-1">LÍDER SETOR 3</p>
                  </div>
                </div>
                {/* Profile Card 4 */}
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center max-w-[280px] w-full">
                  <div className="w-full aspect-square max-w-[250px] bg-[#E0E8FA] rounded-2xl relative overflow-hidden">
                    <img src="https://placehold.co/288x294/E0E8FA/0F2B45?text=Foto" alt="Foto do Pb. Marcos Valter" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full px-2">
                    <h4 className="text-sm md:text-base font-bold uppercase text-[#edbe66] leading-tight">Pb. Marcos Valter</h4>
                    <p className="text-xs uppercase text-[#d9d9d9] leading-tight mt-1">Líder Setor 4</p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </section>

        {/* Seção Mockups das Camisetas */}
        <section id="camisetas" className="py-20 md:py-32 bg-[#d9d9d9] text-[#0f2b45]">
          <div className="container mx-auto px-6">
            <h3 className="text-4xl md:text-5xl font-extrabold uppercase tracking-[2px] mb-4 text-center text-[#0f2b45]" data-aos="fade-up">NOSSA CAMISETA</h3>
            <p className="max-w-3xl mx-auto text-center text-lg md:text-xl leading-relaxed mb-12" data-aos="fade-up" data-aos-delay="100">Vista a camisa do nosso congresso! Desenvolvida com um design moderno e tecido de alta qualidade para você levar a identidade da juventude assembleiana por onde for.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center" data-aos="zoom-in">
                <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/FRENTE.webp" alt="Mockup da camiseta - Frente" className="rounded-lg mb-4 w-full" />
                <h4 className="text-2xl font-bold">Design Frontal</h4>
                <p>Slogan "Tempo de Glória"</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center" data-aos="zoom-in" data-aos-delay="150">
                <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/COSTAS.webp" alt="Mockup da camiseta - Costas" className="rounded-lg mb-4 w-full" />
                <h4 className="text-2xl font-bold">Design Costas</h4>
                <p>Tema do evento regional</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-lg text-center md:col-span-2 lg:col-span-1" data-aos="zoom-in" data-aos-delay="300">
                <img src="https://bwrgpdlxhudtyewlmscl.supabase.co/storage/v1/object/public/Assets/DETALHE.webp" alt="Detalhe da camiseta" className="rounded-lg mb-4 w-full" />
                <h4 className="text-2xl font-bold">Design Moderno</h4>
                <p>Tecido 100% algodão</p>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Ensaio Fotográfico */}
        <section id="fotos" className="py-20 md:py-32 bg-[#0f2b45]">
          <div className="container mx-auto px-6">
            <h3 className="text-4xl md:text-5xl font-extrabold uppercase tracking-[2px] mb-4 text-center text-white" data-aos="fade-up">Ensaio Fotográfico</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="col-span-2 row-span-2" data-aos="fade-up">
                <img 
                  src="https://placehold.co/800x800/d9d9d9/0f2b45?text=Modelo+1" 
                  alt="Modelo com camiseta" 
                  className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  onClick={() => openModal('https://placehold.co/800x800/d9d9d9/0f2b45?text=Modelo+1')}
                />
              </div>
              <div data-aos="fade-up" data-aos-delay="100">
                <img 
                  src="https://placehold.co/400x400/d9d9d9/0f2b45?text=Modelo+2" 
                  alt="Modelo com camiseta" 
                  className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  onClick={() => openModal('https://placehold.co/400x400/d9d9d9/0f2b45?text=Modelo+2')}
                />
              </div>
              <div data-aos="fade-up" data-aos-delay="200">
                <img 
                  src="https://placehold.co/400x400/edbe66/0f2b45?text=Modelo+3" 
                  alt="Modelo com camiseta" 
                  className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  onClick={() => openModal('https://placehold.co/400x400/edbe66/0f2b45?text=Modelo+3')}
                />
              </div>
              <div data-aos="fade-up" data-aos-delay="300">
                <img 
                  src="https://placehold.co/400x400/edbe66/0f2b45?text=Modelo+4" 
                  alt="Modelo com camiseta" 
                  className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  onClick={() => openModal('https://placehold.co/400x400/edbe66/0f2b45?text=Modelo+4')}
                />
              </div>
              <div data-aos="fade-up" data-aos-delay="400">
                <img 
                  src="https://placehold.co/400x400/d9d9d9/0f2b45?text=Modelo+5" 
                  alt="Modelo com camiseta" 
                  className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  onClick={() => openModal('https://placehold.co/400x400/d9d9d9/0f2b45?text=Modelo+5')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Seção Adquira Já - Jovens */}
        <section id="adquirir" className="py-12 sm:py-16 md:py-20 lg:py-32 bg-gradient-to-br from-[#d9d9d9] via-white to-[#d9d9d9] text-[#0f2b45] relative overflow-hidden">
          {/* Background decorativo */}

          
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Badge */}
            <div className="flex justify-center mb-6 sm:mb-8" data-aos="fade-down">
              <div className="bg-[#0f2b45] text-[#edbe66] px-4 sm:px-6 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wider">Compra Individual</span>
              </div>
            </div>
            
            <div className="text-center" data-aos="fade-up">
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 text-[#0f2b45] leading-tight">Garanta Sua Camiseta!</h3>
              
              <p className="max-w-4xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed mb-8 sm:mb-12 text-[#0f2b45]/80">
                Vista a camisa oficial do congresso e carregue a mensagem por onde for. 
                <span className="text-[#edbe66] font-bold">Estoque limitado</span> - garante já a sua!
              </p>
              
              {/* Lotes das Camisetas */}
              <div className="mb-8 sm:mb-12" data-aos="fade-up" data-aos-delay="200">
                <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0f2b45] mb-6 sm:mb-8 text-center">Lotes disponíveis</h4>
                
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-8 sm:mb-12">
                  {/* Lote 1 - ATIVO */}
                  <div className="bg-[#0f2b45] backdrop-blur-sm border-2 border-[#edbe66]/30 rounded-2xl p-4 sm:p-6 hover:border-[#edbe66] hover:shadow-xl transition-all duration-300 group">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="inline-flex items-center gap-2 bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        Ativo
                      </div>
                      <h5 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">1º Lote</h5>
                      <p className="text-2xl sm:text-3xl font-black text-white">R$ 40<span className="text-base sm:text-lg">,00</span></p>
                      <p className="text-[#edbe66] font-bold text-xs sm:text-sm">Até 30/09/2025</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/80 text-xs sm:text-sm mb-1 sm:mb-2">✨ Preço especial de lançamento</p>
                      <p className="text-white/80 text-xs sm:text-sm">Aproveite o melhor preço!</p>
                    </div>
                  </div>

                  {/* Lote 2 - INATIVO */}
                  <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl p-4 sm:p-6">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Em breve
                      </div>
                      <h5 className="text-lg sm:text-xl font-bold text-[#0f2b45] mb-1 sm:mb-2">2º Lote</h5>
                      <p className="text-2xl sm:text-3xl font-black text-[#0f2b45]">R$ 50<span className="text-base sm:text-lg">,00</span></p>
                      <p className="text-[#0f2b45]/60 font-bold text-xs sm:text-sm">01/10 - 15/10/2025</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#0f2b45]/70 text-xs sm:text-sm mb-1 sm:mb-2">🚨 Encerramento dos pedidos online</p>
                      <p className="text-[#0f2b45]/70 text-xs sm:text-sm">Última chance para comprar online!</p>
                    </div>
                  </div>

                  {/* Lote 3 - INATIVO */}
                  <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl p-4 sm:p-6 sm:col-span-2 md:col-span-1">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Em breve
                      </div>
                      <h5 className="text-lg sm:text-xl font-bold text-[#0f2b45] mb-1 sm:mb-2">3º Lote</h5>
                      <p className="text-2xl sm:text-3xl font-black text-[#0f2b45]">R$ 60<span className="text-base sm:text-lg">,00</span></p>
                      <p className="text-[#0f2b45]/60 font-bold text-xs sm:text-sm">Dia do Evento 01/11/2025</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[#0f2b45]/70 text-xs sm:text-sm mb-1 sm:mb-2">🔥 Última oportunidade</p>
                      <p className="text-[#0f2b45]/70 text-xs sm:text-sm">Venda Presencial</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <div className="max-w-md mx-auto" data-aos="zoom-in" data-aos-delay="100">
                <Link 
                  to="/venda-jovem" 
                  className="block w-full bg-[#edbe66] text-[#0f2b45] font-black py-3 sm:py-4 px-6 sm:px-8 rounded-full text-lg sm:text-xl transition-all duration-300 shadow-[0_8px_25px_rgba(237,190,102,0.3)] hover:transform hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(237,190,102,0.5)] hover:bg-[#d4a853] group"
                >
                  <span className="flex items-center justify-center gap-2 sm:gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm sm:text-base lg:text-lg">Comprar Minha Camiseta</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Seção Especial para Líderes */}
        <section className="py-12 sm:py-16 md:py-20 lg:py-32 bg-gradient-to-br from-[#0f2b45] via-[#1a3a5c] to-[#0f2b45] text-white relative overflow-hidden">
          {/* Background decorativo */}
          <div className="absolute inset-0 opacity-10">

            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#edbe66] rounded-full opacity-20"></div>
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 text-center relative z-10" data-aos="fade-up">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 sm:gap-3 bg-[#edbe66]/10 backdrop-blur-sm border border-[#edbe66]/30 rounded-full px-4 sm:px-6 py-2 mb-4 sm:mb-6">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#edbe66]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-[#edbe66] font-semibold text-xs sm:text-sm uppercase tracking-wider">Área Exclusiva</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 text-[#edbe66] leading-tight">Você é Líder de Jovens?</h3>
              
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#d9d9d9] leading-relaxed mb-6 sm:mb-8 max-w-3xl mx-auto">
                Simplifique o processo! Faça o pedido completo do seu grupo em uma única compra e garanta que todos os jovens tenham sua camiseta oficial.
              </p>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 text-left">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#edbe66] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#0f2b45]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[#edbe66] mb-1 sm:mb-2">Processo Simplificado</h4>
                  <p className="text-[#d9d9d9] text-xs sm:text-sm">Um único pedido para todo o grupo, sem complicações</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#edbe66] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#0f2b45]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[#edbe66] mb-1 sm:mb-2">Gestão Financeira</h4>
                  <p className="text-[#d9d9d9] text-xs sm:text-sm">Controle total dos valores e facilidade no pagamento</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 sm:col-span-2 md:col-span-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#edbe66] rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#0f2b45]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-[#edbe66] mb-1 sm:mb-2">Organização Total</h4>
                  <p className="text-[#d9d9d9] text-xs sm:text-sm">Cadastre todos os participantes de forma organizada</p>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <Link 
                  to="/venda-lider" 
                  className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#edbe66] to-[#f5d078] text-[#0f2b45] font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg transition-all duration-300 shadow-[0_8px_25px_rgba(237,190,102,0.3)] hover:transform hover:-translate-y-2 hover:shadow-[0_12px_35px_rgba(237,190,102,0.4)] group"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm sm:text-base">Fazer Pedido do Grupo</span>
                </Link>
                
                <p className="text-[#d9d9d9] text-xs sm:text-sm max-w-2xl mx-auto">
                  Acesso exclusivo para líderes cadastrados • Processo otimizado para grupos • Suporte dedicado
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f2b45] border-t border-[#edbe66]/20 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 text-center text-[#d9d9d9]">
          <p className="font-bold text-lg sm:text-xl mb-2 text-[#edbe66]">9ª REGIÃO - UMADEPAR 2025</p>
          <p className="text-sm sm:text-base">© 2025 - Todos os direitos reservados.</p>
          <div className="flex justify-center space-x-4 sm:space-x-6 mt-3 sm:mt-4">
            <a href="#" className="hover:text-[#edbe66] transition text-sm sm:text-base">Facebook</a>
            <a href="#" className="hover:text-[#edbe66] transition text-sm sm:text-base">Instagram</a>
            <a href="#" className="hover:text-[#edbe66] transition text-sm sm:text-base">YouTube</a>
          </div>
        </div>
      </footer>

      {/* Modal para Imagens */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button 
              className="absolute -top-4 -right-4 md:top-0 md:-right-12 text-white text-4xl font-bold"
              onClick={closeModal}
            >
              &times;
            </button>
            <img 
              src={modalImageSrc} 
              alt="Imagem ampliada" 
              className="rounded-lg shadow-2xl object-contain max-w-full max-h-[90vh]" 
            />
          </div>
        </div>
      )}
    </div>
  );
}