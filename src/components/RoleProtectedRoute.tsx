import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('jovem' | 'lider' | 'admin')[];
  redirectTo?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}) => {
  const { user, userData, loading, error } = useAuth();
  const [waitingForUserData, setWaitingForUserData] = useState(false);
  const [userDataTimeout, setUserDataTimeout] = useState(false);

  // Aguardar dados do usuário por um tempo limitado
  useEffect(() => {
    if (user && !userData && !loading && !error) {
      if (!waitingForUserData) {
        setWaitingForUserData(true);
        // Timeout de 10 segundos para carregar userData
        const timer = setTimeout(() => {
          console.warn('⚠️ [RoleProtection] Timeout ao aguardar dados do usuário');
          setUserDataTimeout(true);
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    } else if (userData) {
      setWaitingForUserData(false);
      setUserDataTimeout(false);
    }
  }, [user, userData, loading, error, waitingForUserData]);

  // Mostrar loading enquanto carrega ou aguarda dados do usuário
  if (loading || (user && !userData && !userDataTimeout && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2b45] to-[#1a3a5a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#edbe66] mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {waitingForUserData ? 'Carregando perfil...' : 'Verificando acesso...'}
          </p>
          {error && (
            <p className="text-yellow-300 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Redirecionar se não estiver logado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionar se não tiver dados do usuário após timeout ou erro
  if (user && (!userData && (userDataTimeout || error))) {
    console.warn('⚠️ [RoleProtection] Dados do usuário não encontrados ou erro ao carregar');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2b45] to-[#1a3a5a]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-4">Erro de Acesso</h2>
          <p className="text-gray-300 mb-6">
            {error || 'Não foi possível carregar os dados do seu perfil. Tente fazer login novamente.'}
          </p>
          <Navigate to="/login" replace />
        </div>
      </div>
    );
  }

  // Se não há userData mas também não há user, deixar o ProtectedRoute lidar
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se ainda não tem userData mas tem user, continuar aguardando
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2b45] to-[#1a3a5a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#edbe66] mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Verificar se o tipo do usuário está nas roles permitidas
  if (!allowedRoles.includes(userData.tipo)) {
    console.warn(`⚠️ [RoleProtection] Acesso negado. Tipo: ${userData.tipo}, Permitidos: ${allowedRoles.join(', ')}`);
    return <Navigate to={redirectTo} replace />;
  }

  // Se passou em todas as verificações, renderizar o componente
  return <>{children}</>;
};

export default RoleProtectedRoute;