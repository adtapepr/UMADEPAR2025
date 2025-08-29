import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/orderService';

interface UserData {
  id: string;
  email: string;
  nome: string;
  tipo: 'jovem' | 'lider' | 'admin';
  telefone?: string;
  endereco?: string;
  cidade?: string;
  igreja?: string;
  lider?: string;
  pastor?: string;
  foto_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceLogout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Função para salvar userData no localStorage
  const saveUserDataToStorage = useCallback((userData: UserData | null) => {
    try {
      if (userData) {
        localStorage.setItem('umadepar_user_data', JSON.stringify(userData));
        console.log('💾 [Auth] UserData salvo no localStorage:', userData.nome, userData.tipo);
      } else {
        localStorage.removeItem('umadepar_user_data');
        console.log('🗑️ [Auth] UserData removido do localStorage');
      }
    } catch (error) {
      console.warn('⚠️ [Auth] Erro ao salvar userData no localStorage:', error);
    }
  }, []);

  // Função para carregar userData do localStorage
  const loadUserDataFromStorage = useCallback((): UserData | null => {
    try {
      const stored = localStorage.getItem('umadepar_user_data');
      if (stored) {
        const userData = JSON.parse(stored) as UserData;
        console.log('📂 [Auth] UserData carregado do localStorage:', userData.nome, userData.tipo);
        return userData;
      }
    } catch (error) {
      console.warn('⚠️ [Auth] Erro ao carregar userData do localStorage:', error);
      localStorage.removeItem('umadepar_user_data');
    }
    return null;
  }, []);

  // Função para buscar dados do usuário da tabela public.users
  const fetchUserData = useCallback(async (userId: string, retryCount = 0): Promise<UserData | null> => {
    try {
      console.log(`🔍 [Auth] Buscando dados do usuário ${userId} (tentativa ${retryCount + 1})`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Se for erro de política RLS (recursão infinita), não tentar novamente
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn('⚠️ [Auth] Erro de política RLS detectado, pulando busca de dados do usuário');
          return null;
        }
        console.error('❌ [Auth] Erro ao buscar dados do usuário:', error);
        
        // Retry em caso de erro de rede
        if (retryCount < maxRetries && (error.message.includes('network') || error.message.includes('timeout'))) {
          console.log(`🔄 [Auth] Tentativa ${retryCount + 1}/${maxRetries} para buscar dados do usuário`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchUserData(userId, retryCount + 1);
        }
        
        return null;
      }
      
      console.log('✅ [Auth] Dados do usuário carregados do banco:', data.nome, data.tipo);
      retryCountRef.current = 0; // Reset retry count on success
      
      const userData = data as UserData;
      
      // Sincronizar metadados do usuário no JWT
      try {
        console.log('🔄 [Auth] Sincronizando metadados do usuário no JWT...');
        const { error: rpcError } = await supabase.rpc('sync_user_metadata');
        if (rpcError) {
          console.warn('⚠️ [Auth] Erro ao sincronizar metadados:', rpcError);
        } else {
          console.log('✅ [Auth] Metadados sincronizados com sucesso');
        }
      } catch (syncError) {
        console.warn('⚠️ [Auth] Erro inesperado ao sincronizar metadados:', syncError);
      }
      
      // Salvar no localStorage para persistência
      saveUserDataToStorage(userData);
      
      return userData;
    } catch (error) {
      console.error('❌ [Auth] Erro inesperado ao buscar dados:', error);
      return null;
    }
  }, [saveUserDataToStorage]);

  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 [Auth] Renovando sessão...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [Auth] Erro ao renovar sessão:', error);
        setError('Sessão expirada. Faça login novamente.');
        await signOut();
        return;
      }

      if (session) {
        console.log('✅ [Auth] Sessão renovada com sucesso');
        setSession(session);
        setUser(session.user);
        clearError();
      }
    } catch (error) {
      console.error('❌ [Auth] Erro inesperado ao renovar sessão:', error);
      setError('Erro de conexão. Verifique sua internet.');
    }
  }, []);

  const scheduleSessionRefresh = useCallback((session: Session) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const expiresAt = session.expires_at;
    if (expiresAt) {
      // Renovar 5 minutos antes do vencimento
      const refreshTime = (expiresAt * 1000) - Date.now() - (5 * 60 * 1000);
      
      if (refreshTime > 0) {
        refreshTimeoutRef.current = setTimeout(() => {
          refreshSession();
        }, refreshTime);
        
        console.log(`⏰ [Auth] Sessão será renovada em ${Math.round(refreshTime / 1000 / 60)} minutos`);
      }
    }
  }, [refreshSession]);

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      try {
        setLoading(true);
        console.log('🔄 [Auth] Verificando sessão atual...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ [Auth] Erro ao obter sessão:', error);
          setError('Erro ao verificar autenticação');
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Buscar dados do usuário se estiver logado
          if (session?.user) {
            console.log('👤 [Auth] Usuário logado detectado:', session.user.email);
            
            // Primeiro, tentar carregar do localStorage
            let userData = loadUserDataFromStorage();
            
            // Verificar se os dados do localStorage são do usuário atual
            if (userData && userData.id !== session.user.id) {
              console.log('⚠️ [Auth] UserData do localStorage é de outro usuário, removendo...');
              saveUserDataToStorage(null);
              userData = null;
            }
            
            // Se não tem userData válido, buscar do banco
            if (!userData) {
              console.log('🔍 [Auth] Buscando userData do banco...');
              userData = await fetchUserData(session.user.id);
            }
            
            setUserData(userData);
            scheduleSessionRefresh(session);
          } else {
            console.log('🚪 [Auth] Nenhum usuário logado');
            setUserData(null);
            saveUserDataToStorage(null);
          }
          clearError();
        }
      } catch (error) {
        console.error('❌ [Auth] Erro ao verificar sessão:', error);
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [Auth] Estado de autenticação mudou:', event, session?.user?.email || 'sem usuário');
        
        // Limpar timeout anterior
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Buscar dados do usuário se estiver logado
        if (session?.user) {
          console.log('👤 [Auth] Processando login/mudança para:', session.user.email);
          
          // Primeiro, tentar carregar do localStorage
          let userData = loadUserDataFromStorage();
          
          // Verificar se os dados do localStorage são do usuário atual
          if (userData && userData.id !== session.user.id) {
            console.log('⚠️ [Auth] UserData do localStorage é de outro usuário, removendo...');
            saveUserDataToStorage(null);
            userData = null;
          }
          
          // Se não tem userData válido, buscar do banco
          if (!userData) {
            console.log('🔍 [Auth] Buscando userData do banco para:', session.user.email);
            userData = await fetchUserData(session.user.id);
          }
          
          setUserData(userData);
          scheduleSessionRefresh(session);
          clearError();
        } else {
          console.log('🚪 [Auth] Processando logout/sem usuário');
          setUserData(null);
          saveUserDataToStorage(null);
          if (event === 'SIGNED_OUT') {
            setError(null);
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [fetchUserData, scheduleSessionRefresh, clearError, loadUserDataFromStorage, saveUserDataToStorage]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ [Auth] Erro no login:', error);
        return { error };
      }
      
      console.log('✅ [Auth] Login realizado com sucesso:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('❌ [Auth] Erro inesperado no login:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });
      
      if (error) {
        console.error('❌ [Auth] Erro no cadastro:', error);
        return { error };
      }
      
      console.log('✅ [Auth] Cadastro realizado com sucesso:', data.user?.email);
      console.log('🔄 [Auth] Trigger do banco criará automaticamente o perfil na tabela users');
      return { error: null };
    } catch (error) {
      console.error('❌ [Auth] Erro inesperado no cadastro:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Limpar timeout de renovação
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      console.log('🚪 [Auth] Iniciando logout...');
      
      // Usar scope global para garantir logout completo
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('❌ [Auth] Erro no logout:', error);
        // Mesmo com erro, limpar estados locais
        setUser(null);
        setUserData(null);
        setSession(null);
        setError(null);
      } else {
        console.log('✅ [Auth] Logout realizado com sucesso');
      }
      
      // Garantir que os estados sejam limpos independentemente
      setUser(null);
      setUserData(null);
      setSession(null);
      setError(null);
      
      // Limpar userData do localStorage
      saveUserDataToStorage(null);
      
    } catch (error) {
        console.error('❌ [Auth] Erro inesperado no logout:', error);
        // Limpar estados mesmo em caso de erro
        setUser(null);
        setUserData(null);
        setSession(null);
        setError(null);
        saveUserDataToStorage(null);
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = async () => {
    try {
      console.log('🔥 [Auth] Iniciando logout forçado...');
      
      // Limpar timeout de renovação imediatamente
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      // Limpar todos os dados do localStorage e sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🧹 [Auth] Cache local limpo');
      } catch (storageError) {
        console.warn('⚠️ [Auth] Erro ao limpar storage:', storageError);
      }
      
      // Tentar invalidar a sessão no Supabase com múltiplas tentativas
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('✅ [Auth] Sessão invalidada no Supabase');
      } catch (supabaseError) {
        console.warn('⚠️ [Auth] Erro ao invalidar sessão no Supabase:', supabaseError);
        // Continuar mesmo com erro no Supabase
      }
      
      // Limpar estados do contexto imediatamente
      setUser(null);
      setUserData(null);
      setSession(null);
      setError(null);
      setLoading(false);
      
      // Limpar qualquer cache do Supabase
      try {
        // Forçar limpeza do cache interno do Supabase
        await supabase.auth.refreshSession();
      } catch {
        // Ignorar erro, é esperado após logout
      }
      
      console.log('🔥 [Auth] Logout forçado concluído');
      
    } catch (error) {
      console.error('❌ [Auth] Erro no logout forçado:', error);
      // Mesmo com erro, garantir limpeza dos estados
      setUser(null);
      setUserData(null);
      setSession(null);
      setError(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('❌ [Auth] Erro ao enviar email de recuperação:', error);
        return { error };
      }
      
      console.log('✅ [Auth] Email de recuperação enviado com sucesso');
      return { error: null };
    } catch (error) {
      console.error('❌ [Auth] Erro inesperado na recuperação:', error);
      return { error };
    }
  };

  const value = {
    user,
    userData,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    forceLogout,
    resetPassword,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};