import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PostgrestError } from '@supabase/supabase-js';

interface AuthErrorHandlerOptions {
  onUnauthorized?: () => void;
  onRLSError?: () => void;
  onNetworkError?: () => void;
  showToast?: boolean;
}

export const useAuthErrorHandler = (options: AuthErrorHandlerOptions = {}) => {
  const { signOut, refreshSession } = useAuth();

  const handleError = useCallback(async (error: any): Promise<boolean> => {
    console.error('🔍 [AuthErrorHandler] Analisando erro:', error);

    // Erro de autenticação - token inválido ou expirado
    if (
      error?.message?.includes('JWT') ||
      error?.message?.includes('invalid_token') ||
      error?.message?.includes('token_expired') ||
      error?.code === 'PGRST301' ||
      error?.status === 401
    ) {
      console.warn('🔐 [AuthErrorHandler] Erro de autenticação detectado');
      
      try {
        // Tentar renovar a sessão primeiro
        await refreshSession();
        console.log('✅ [AuthErrorHandler] Sessão renovada com sucesso');
        return true; // Indica que pode tentar novamente
      } catch (refreshError) {
        console.error('❌ [AuthErrorHandler] Falha ao renovar sessão:', refreshError);
        
        if (options.onUnauthorized) {
          options.onUnauthorized();
        } else {
          // Fazer logout se não conseguir renovar
          await signOut();
        }
        return false;
      }
    }

    // Erro de RLS (Row Level Security)
    if (
      error?.message?.includes('RLS') ||
      error?.message?.includes('policy') ||
      error?.message?.includes('permission denied') ||
      error?.code === 'PGRST116' ||
      error?.status === 403
    ) {
      console.warn('🛡️ [AuthErrorHandler] Erro de RLS detectado');
      
      if (options.onRLSError) {
        options.onRLSError();
      }
      return false;
    }

    // Erro de rede
    if (
      error?.message?.includes('network') ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('timeout') ||
      error?.name === 'NetworkError' ||
      !navigator.onLine
    ) {
      console.warn('🌐 [AuthErrorHandler] Erro de rede detectado');
      
      if (options.onNetworkError) {
        options.onNetworkError();
      }
      return true; // Pode tentar novamente
    }

    // Outros erros
    console.warn('⚠️ [AuthErrorHandler] Erro não tratado:', error);
    return false;
  }, [signOut, refreshSession, options]);

  const withErrorHandling = useCallback(
    async <T>(operation: () => Promise<T>, retries = 2): Promise<T | null> => {
      let lastError: any;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const result = await operation();
          return result;
        } catch (error) {
          lastError = error;
          console.log(`🔄 [AuthErrorHandler] Tentativa ${attempt + 1}/${retries + 1} falhou:`, error);
          
          const shouldRetry = await handleError(error);
          
          if (!shouldRetry || attempt === retries) {
            break;
          }
          
          // Delay progressivo entre tentativas
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
      
      console.error('❌ [AuthErrorHandler] Operação falhou após todas as tentativas:', lastError);
      return null;
    },
    [handleError]
  );

  return {
    handleError,
    withErrorHandling
  };
};

export default useAuthErrorHandler;