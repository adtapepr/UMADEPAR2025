import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import VendaJovem from "@/pages/VendaJovem";
import VendaLider from "@/pages/VendaLider";
import DashboardAdm from "@/pages/DashboardAdm";
import PainelControle from "@/pages/PainelControle";
import MeusPedidos from "@/pages/MeusPedidos";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentPending from "@/pages/PaymentPending";
import PaymentFailure from "@/pages/PaymentFailure";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import ErrorNotification from "@/components/ErrorNotification";
import { useCustomCursor } from "@/hooks/useCustomCursor";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function AppContent() {
  const { error } = useAuth();

  return (
    <>
      <Router>
        <ScrollToTop />
        <ErrorNotification 
          error={error} 
          type={error?.includes('Sessão expirada') ? 'warning' : 'error'}
        />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/venda-jovem" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['jovem', 'admin']} redirectTo="/venda-lider">
                  <VendaJovem />
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/venda-lider" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['lider', 'admin']}>
                  <VendaLider />
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/dashboard-adm" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <DashboardAdm />
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/painel-controle" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <PainelControle />
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/meus-pedidos" element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['jovem', 'lider', 'admin']}>
                  <MeusPedidos />
                </RoleProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/pending" element={<PaymentPending />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
            <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
        </Routes>
      </Router>
    </>
  );
}

export default function App() {
  // Inicializar cursor personalizado
  useCustomCursor();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
