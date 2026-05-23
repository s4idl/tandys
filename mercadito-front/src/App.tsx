import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import MarketMap from './features/map/marketMap';
import Navbar from './features/ui/Navbar';
import RequestModal from './features/ui/RequestModal';
import AuthModal from './features/auth/AuthModal';
import Solicitudes from './pages/Solicitudes/Solicitudes';
import MisMarcas from './pages/miMarca/MisMarcas';
import Pagos from './pages/pagos/Pagos';
import Perfil from './pages/perfil/Perfil';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import { useUserStore } from './store/userStore';
import './App.css';

// ─── Protected Route Component ────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, setShowAuthModal } = useUserStore();
  const location = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, setShowAuthModal]);

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// ─── Map root page ────────────────────────────────────────────────────────────
const MapPage = () => {
  // Role pulled from global store — shared with all inner pages
  const { userType, setUserType, isAuthenticated, setShowAuthModal, showAuthModal } = useUserStore();
  const navigate = useNavigate();

  const isAdmin = userType === 'admin';

  return (
    <div className="map-root">
      {/* Full-screen canvas */}
      <div className="canvas-layer">
        <MarketMap isAdmin={isAdmin} />
      </div>

      {/* Floating tab bar + fixed logo */}
      <Navbar userType={userType} />

      {/* Top-right Action Button (Only for authenticated users) */}
      {isAuthenticated && (
        <button
          className="btn-registrar-marca-fixed"
          onClick={() => navigate('/mi-marca', { state: { autoOpenWizard: true } })}
        >
          Registrar Marca
        </button>
      )}

      {/* Request modal — self-renders when an available space is selected */}
      <RequestModal isAdmin={isAdmin} />
      
      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

// ─── Inner page shell (Navbar flotante, rol global compartido) ────────────────
const InnerShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Same global store — role stays consistent when navigating back to map
  const { userType, setUserType } = useUserStore();
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowY: 'auto', overflowX: 'hidden' }}>
      {children}
      <Navbar userType={userType} />
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  const { showAuthModal, setShowAuthModal } = useUserStore();

  return (
    <BrowserRouter>
      {/* Global Auth Modal for Protected Routes Redirections */}
      {showAuthModal && <div style={{position: 'fixed', zIndex: 9999}}><AuthModal onClose={() => setShowAuthModal(false)} /></div>}

      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/solicitudes" element={<ProtectedRoute><InnerShell><Solicitudes /></InnerShell></ProtectedRoute>} />
        <Route path="/pagos" element={<ProtectedRoute><InnerShell><Pagos /></InnerShell></ProtectedRoute>} />
        <Route path="/mi-marca" element={<ProtectedRoute><InnerShell><MisMarcas /></InnerShell></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><InnerShell><Perfil /></InnerShell></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><InnerShell><DashboardAdmin /></InnerShell></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
