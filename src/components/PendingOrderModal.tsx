import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CreditCard, ShoppingCart, X, Trash2 } from 'lucide-react';
import { OrderWithDetails, OrderService } from '../services/orderService';

interface PendingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingOrder: OrderWithDetails;
  onCreateNew: () => void;
  onOrderDeleted?: () => void;
}

const PendingOrderModal: React.FC<PendingOrderModalProps> = ({
  isOpen,
  onClose,
  pendingOrder,
  onCreateNew,
  onOrderDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteOrder = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await OrderService.deleteOrder(pendingOrder.id);
      onOrderDeleted?.();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      alert('Erro ao excluir pedido. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0f2b45] rounded-xl p-6 max-w-md w-full border border-[#edbe66]/30 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-xl font-bold text-white">Pedido Pendente</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm mb-3">
              Você possui um pedido pendente que ainda não foi finalizado. 
              Finalize o pagamento ou crie um novo pedido.
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Pedido:</span>
                <span className="text-white font-semibold">
                  #{pendingOrder.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Valor:</span>
                <span className="text-[#edbe66] font-bold">
                  {formatCurrency(pendingOrder.valor_total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tipo:</span>
                <span className="text-white capitalize">
                  {pendingOrder.tipo_pedido}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Criado em:</span>
                <span className="text-white">
                  {formatDate(pendingOrder.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Link
            to="/meus-pedidos"
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#edbe66] text-[#0f2b45] font-bold rounded-lg hover:bg-[#edbe66]/90 transition-colors"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Finalizar Pagamento
          </Link>
          
          <button
            onClick={onCreateNew}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-transparent border border-[#edbe66] text-[#edbe66] font-semibold rounded-lg hover:bg-[#edbe66]/10 transition-colors"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Criar Novo Pedido
          </button>

          <button
            onClick={handleDeleteOrder}
            disabled={isDeleting}
            className={`w-full inline-flex items-center justify-center px-4 py-2 border border-red-500 font-semibold rounded-lg transition-colors ${
              showDeleteConfirm 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-transparent text-red-500 hover:bg-red-500/10'
            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Excluindo...' : showDeleteConfirm ? 'Confirmar Exclusão' : 'Excluir Pedido'}
          </button>

          {showDeleteConfirm && (
            <button
              onClick={handleCancelDelete}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-transparent border border-gray-500 text-gray-400 font-semibold rounded-lg hover:bg-gray-500/10 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingOrderModal;