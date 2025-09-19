import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

type ViewType = 'login' | 'register' | 'complete-register' | 'forgot-password';

const Login: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [photoPreview, setPhotoPreview] = useState<string>('https://placehold.co/100x100/d9d9d9/0f2b45?text=+');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, showSuccess, showError, removeToast } = useToast();
  
  // Capturar a página de origem do redirecionamento
  const from = location.state?.from?.pathname || '/';
  const [formData, setFormData] = useState({
    // Login
    loginEmail: '',
    loginPassword: '',
    // Register Step 1
    registerName: '',
    registerEmail: '',
    registerPassword: '',
    confirmPassword: '',
    // Register Step 2
    profilePhoto: null as File | null,
    role: '',
    countryCode: '+55',
    phoneNumber: '',
    street: '',
    number: '',
    neighborhood: '',
    state: '',
    city: '',
    church: '',
    leaderName: '',
    pastorName: '',
    // Forgot Password
    forgotEmail: ''
  });

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [showOtherCityInput, setShowOtherCityInput] = useState(false);

  const countries = [
    { code: '+55', flag: '🇧🇷', name: 'Brasil' },
    { code: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
    { code: '+44', flag: '🇬🇧', name: 'Reino Unido' },
    { code: '+33', flag: '🇫🇷', name: 'França' },
    { code: '+49', flag: '🇩🇪', name: 'Alemanha' },
    { code: '+34', flag: '🇪🇸', name: 'Espanha' },
    { code: '+39', flag: '🇮🇹', name: 'Itália' },
    { code: '+81', flag: '🇯🇵', name: 'Japão' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+91', flag: '🇮🇳', name: 'Índia' }
  ];

  const cities = [
    // Paraná (PR) - ordem alfabética
    'Alto Paraíso',
    'Altônia',
    'Cidade Gaúcha',
    'Cruzeiro do Oeste',
    'Douradina',
    'Francisco Alves',
    'Goioerê',
    'Guaíra',
    'Icaraíma',
    'Iporã',
    'Ivaté',
    'Maria Helena',
    'Mariluz',
    'Maripá',
    'Moreira Sales',
    'Nova Olímpia',
    'Palotina',
    'Perobal',
    'Pérola',
    'Tapejara',
    'Terra Roxa',
    'Tuneiras do Oeste',
    'Umuarama',
    // Mato Grosso do Sul (MS) - ordem alfabética
    'Mundo Novo (MS)',
    'Paranhos (MS)',
    'Sete Quedas (MS)',
    // Opção para outras cidades
    'Outra...'
  ];
    

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
  };

  const selectCountry = (countryCode: string) => {
    setFormData(prev => ({ ...prev, countryCode }));
    setIsCountryDropdownOpen(false);
  };

  const selectCity = (city: string) => {
    if (city === 'Outra...') {
      setShowOtherCityInput(true);
      setFormData(prev => ({ ...prev, city: '' }));
    } else {
      setShowOtherCityInput(false);
      setFormData(prev => ({ ...prev, city }));
    }
    setIsCityDropdownOpen(false);
  };

  const selectedCountry = countries.find(c => c.code === formData.countryCode) || countries[0];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await signIn(formData.loginEmail, formData.loginPassword);
      
      if (error) {
        setErrorMessage(error.message || 'Erro ao fazer login');
        showError('Erro ao fazer login: ' + (error.message || 'Erro desconhecido'));
      } else {
        // Mostrar notificação de sucesso
        showSuccess('Login realizado com sucesso!');
        // Redirecionar para a página original ou home
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000); // Aguardar um pouco para mostrar a notificação
      }
    } catch (error) {
      setErrorMessage('Erro inesperado ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validação dos campos da etapa 1
    if (formData.registerPassword !== formData.confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    setCurrentView('complete-register');
  };

  const handleCompleteRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const userData = {
        nome: formData.registerName,
        name: formData.registerName, // fallback para compatibilidade
        role: formData.role,
        tipo: formData.role, // Enviar o valor direto do radio button
        telefone: `${formData.countryCode}${formData.phoneNumber}`,
        endereco: `${formData.street}, ${formData.number}, ${formData.neighborhood}`,
        cidade: formData.city,
        igreja: formData.church,
        lider: formData.leaderName,
        pastor: formData.pastorName
      };
      
      const { error } = await signUp(formData.registerEmail, formData.registerPassword, userData);
      
      if (error) {
        setErrorMessage(error.message || 'Erro ao criar conta');
        showError('Erro ao criar conta: ' + (error.message || 'Erro desconhecido'));
      } else {
        // Mostrar notificação de sucesso
        showSuccess('Conta criada com sucesso! Verifique seu email para confirmar.');
        // Redirecionar para a página original ou home após confirmação
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 2000); // Aguardar um pouco mais para ler a notificação
      }
    } catch (error) {
      setErrorMessage('Erro inesperado ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await resetPassword(formData.forgotEmail);
      
      if (error) {
        setErrorMessage(error.message || 'Erro ao enviar email de recuperação');
      } else {
        alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setCurrentView('login');
      }
    } catch (error) {
      setErrorMessage('Erro inesperado ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (view: ViewType) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#0f2b45', color: '#d9d9d9' }}>
      <Link to="/" className="text-3xl font-bold mb-8" style={{ color: '#edbe66' }} data-aos="fade-down">9ª REGIÃO UMADEPAR</Link>

      {/* Card de Login */}
      {currentView === 'login' && (
        <div className="w-full max-w-md" data-aos="fade-up">
          <div className="bg-white p-8 rounded-2xl shadow-2xl" style={{ color: '#0f2b45' }}>
            <h2 className="text-3xl font-bold text-center mb-6">Acessar Conta</h2>
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-4">
                <label htmlFor="login-email" className="block font-bold mb-2">E-mail</label>
                <input
                  type="email"
                  id="login-email"
                  name="loginEmail"
                  value={formData.loginEmail}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="login-password" className="block font-bold mb-2">Senha</label>
                <input
                    type="password"
                    name="loginPassword"
                    value={formData.loginPassword}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-bold py-3 px-10 rounded-full text-lg transition-all duration-300 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#edbe66', color: '#0f2b45' }}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <div className="text-center mt-6">
              <button
                onClick={() => switchView('forgot-password')}
                className="text-sm text-gray-600 hover:underline"
                style={{ color: '#6b7280' }}
              >
                Esqueci a senha
              </button>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-300">
              Ainda não tem cadastro?{' '}
              <button
                onClick={() => switchView('register')}
                className="font-bold hover:underline"
                style={{ color: '#edbe66' }}
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Card de Cadastro - Etapa 1 */}
      {currentView === 'register' && (
        <div className="w-full max-w-md" data-aos="fade-up">
          <div className="bg-white p-8 rounded-2xl shadow-2xl" style={{ color: '#0f2b45' }}>
            <h2 className="text-3xl font-bold text-center mb-6">Criar Conta</h2>
            <form onSubmit={handleRegisterStep1Submit}>
              <div className="mb-4">
                <label htmlFor="register-name" className="block font-bold mb-2">Nome Completo</label>
                <input
                    type="text"
                    name="registerName"
                    value={formData.registerName}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
              </div>
              <div className="mb-4">
                <label htmlFor="register-email" className="block font-bold mb-2">E-mail</label>
                <input
                    type="email"
                    name="registerEmail"
                    value={formData.registerEmail}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
              </div>
              <div className="mb-4">
                <label htmlFor="register-password" className="block font-bold mb-2">Senha</label>
                <input
                    type="password"
                    name="registerPassword"
                    value={formData.registerPassword}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
              </div>
              <div className="mb-6">
                <label htmlFor="confirm-password" className="block font-bold mb-2">Confirmar Senha</label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
              </div>
              <button
                type="submit"
                className="w-full font-bold py-3 px-10 rounded-full text-lg transition-all duration-300 hover:brightness-110"
                style={{ backgroundColor: '#edbe66', color: '#0f2b45' }}
              >
                Continuar
              </button>
            </form>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-300">
              Já tem uma conta?{' '}
              <button
                onClick={() => switchView('login')}
                className="font-bold hover:underline"
                style={{ color: '#edbe66' }}
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Card de Cadastro - Etapa 2 */}
      {currentView === 'complete-register' && (
        <div className="w-full max-w-lg" data-aos="fade-up">
          <div className="bg-white p-8 rounded-2xl shadow-2xl" style={{ color: '#0f2b45' }}>
            <h2 className="text-3xl font-bold text-center mb-6">Concluir Cadastro</h2>
            <form onSubmit={handleCompleteRegisterSubmit}>
              {/* Foto de Perfil */}


              {/* Líder ou Jovem */}
              <div className="mb-4">
                <label className="block font-bold mb-2">Você é:</label>
                <div className="flex gap-4">
                  <label className={`flex-1 p-3 border rounded-full text-center cursor-pointer transition-all duration-300 ${
                    formData.role === 'jovem' 
                      ? 'text-white border-blue-900' 
                      : 'border-gray-300'
                  }`} style={formData.role === 'jovem' ? { backgroundColor: '#0f2b45', borderColor: '#0f2b45' } : {}}>
                    <input
                      type="radio"
                      name="role"
                      value="jovem"
                      checked={formData.role === 'jovem'}
                      onChange={handleInputChange}
                      className="sr-only"
                      required
                    />
                    Jovem
                  </label>
                  <label className={`flex-1 p-3 border rounded-full text-center cursor-pointer transition-all duration-300 ${
                    formData.role === 'lider' 
                      ? 'text-white border-blue-900' 
                      : 'border-gray-300'
                  }`} style={formData.role === 'lider' ? { backgroundColor: '#0f2b45', borderColor: '#0f2b45' } : {}}>
                    <input
                      type="radio"
                      name="role"
                      value="lider"
                      checked={formData.role === 'lider'}
                      onChange={handleInputChange}
                      className="sr-only"
                      required
                    />
                    Líder
                  </label>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="mb-4">
                <label className="block font-bold mb-2">WhatsApp</label>
                <div className="flex gap-2">
                  {/* Seletor de País com Bandeira */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors"
                    >
                      {selectedCountry.flag}
                    </button>
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-3xl shadow-lg z-10 max-h-60 overflow-y-auto">
                        {countries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => selectCountry(country.code)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 first:rounded-t-3xl last:rounded-b-3xl"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="text-sm">{country.code}</span>
                            <span className="text-sm text-gray-600">{country.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Campo de Telefone Unificado */}
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="(44) 99999-9999"
                    maxLength={15}
                    className="flex-1 p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block font-bold mb-2">Logradouro</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Digite o nome da rua"
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">Nº</label>
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="Número da residência"
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block font-bold mb-2">Bairro</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    placeholder="Nome do bairro"
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                    required
                  />
                </div>
                <div className="relative col-span-2">
                  <label className="block font-bold mb-2">Cidade</label>
                  <button
                    type="button"
                    onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                    className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none text-left bg-white"
                    style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                  >
                    {formData.city || 'Selecione a cidade'}
                  </button>
                  <input
                    type="hidden"
                    name="city"
                    value={formData.city}
                    required
                  />
                  {isCityDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-3xl shadow-lg z-10 max-h-60 overflow-y-auto">
                      {cities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => selectCity(city)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-3xl last:rounded-b-3xl"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {showOtherCityInput && (
                  <div className="col-span-2">
                    <label className="block font-bold mb-2">Outra Cidade</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Digite o nome da cidade"
                      className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                      style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Igreja */}
              <div className="mb-4">
                <label className="block font-bold mb-2">Igreja/Congregação</label>
                <input
                  type="text"
                  name="church"
                  value={formData.church}
                  onChange={handleInputChange}
                  placeholder="Nome da sua igreja"
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2">Nome do Líder</label>
                <input
                  type="text"
                  name="leaderName"
                  value={formData.leaderName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                />
              </div>
              <div className="mb-6">
                <label className="block font-bold mb-2">Nome do Pastor</label>
                <input
                  type="text"
                  name="pastorName"
                  value={formData.pastorName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                />
              </div>

              <button
                type="submit"
                className="w-full font-bold py-3 px-10 rounded-full text-lg transition-all duration-300 hover:brightness-110"
                style={{ backgroundColor: '#edbe66', color: '#0f2b45' }}
              >
                Concluir Cadastro
              </button>
            </form>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-300">
              Já tem uma conta?{' '}
              <button
                onClick={() => switchView('login')}
                className="font-bold hover:underline"
                style={{ color: '#edbe66' }}
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Card de Esqueci a Senha */}
      {currentView === 'forgot-password' && (
        <div className="w-full max-w-md" data-aos="fade-up">
          <div className="bg-white p-8 rounded-2xl shadow-2xl" style={{ color: '#0f2b45' }}>
            <h2 className="text-3xl font-bold text-center mb-2">Recuperar Senha</h2>
            <p className="text-center text-gray-600 mb-6">Informe seu e-mail para enviarmos as instruções.</p>
            <form onSubmit={handleForgotPasswordSubmit}>
              <div className="mb-6">
                <label htmlFor="forgot-email" className="block font-bold mb-2">E-mail</label>
                <input
                  type="email"
                  id="forgot-email"
                  name="forgotEmail"
                  value={formData.forgotEmail}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#edbe66' } as React.CSSProperties}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full font-bold py-3 px-10 rounded-full text-lg transition-all duration-300 hover:brightness-110"
                style={{ backgroundColor: '#edbe66', color: '#0f2b45' }}
              >
                Enviar
              </button>
            </form>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-300">
              Lembrou da senha?{' '}
              <button
                onClick={() => switchView('login')}
                className="font-bold hover:underline"
                style={{ color: '#edbe66' }}
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      )}
      
      {/* Container de notificações */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default Login;