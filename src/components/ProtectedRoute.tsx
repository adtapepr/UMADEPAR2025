import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading, error, refreshSession } = useAuth();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 2;

  // Tentar renovar sessão em caso de erro
  useEffect(() => {
    if (error && !loading && retryCount < maxRetries && !isRetrying) {
      setIsRetrying(true);
      const timer = setTimeout(async () => {
        console.log(`🔄 [ProtectedRoute] Tentativa ${retryCount + 1}/${maxRetries} de renovar sessão`);
        await refreshSession();
        setRetryCount(prev => prev + 1);
        setIsRetrying(false);
      }, 1000 * (retryCount + 1)); // Delay progressivo
      
      return () => clearTimeout(timer);
    }
  }, [error, loading, retryCount, refreshSession, isRetrying]);

  // Mostrar loading enquanto verifica autenticação ou durante retry
  if (loading || isRetrying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2b45] to-[#1a3a5a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#edbe66] mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {isRetrying ? `Reconectando... (${retryCount + 1}/${maxRetries})` : 'Carregando...'}
          </p>
          {error && (
            <p className="text-yellow-300 text-sm mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Se houve erro e esgotaram as tentativas, mostrar erro
  if (error && retryCount >= maxRetries) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2b45] to-[#1a3a5a]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-4">Erro de Conexão</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => {
              setRetryCount(0);
              setIsRetrying(false);
              refreshSession();
            }}
            className="bg-[#edbe66] text-[#0f2b45] px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Tentar Novamente
          </button>
          <div className="mt-4">
            <Navigate to="/login" state={{ from: location }} replace />
          </div>
        </div>
      </div>
    );
  }

  // Se requer autenticação e usuário não está logado, redirecionar para login
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não requer autenticação e usuário está logado, permitir acesso
  // Se requer autenticação e usuário está logado, permitir acesso
  return <>{children}</>;
};

export default ProtectedRoute;