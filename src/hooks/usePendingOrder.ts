import { useState, useEffect } from 'react';
import { OrderService, OrderWithDetails } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';

export const usePendingOrder = () => {
  const [pendingOrder, setPendingOrder] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const checkPendingOrder = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const orders = await OrderService.getUserOrdersWithDetails();
      
      // Procura por pedidos pendentes com mp_preference_id (que podem ser finalizados)
      const pending = orders.find(order => 
        order.status === 'pendente' && order.mp_preference_id
      );
      
      setPendingOrder(pending || null);
    } catch (err) {
      console.error('Erro ao verificar pedidos pendentes:', err);
      setError('Erro ao verificar pedidos pendentes');
      setPendingOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkPendingOrder();
  }, [user]);

  return {
    pendingOrder,
    isLoading,
    error,
    refetch: checkPendingOrder
  };
};