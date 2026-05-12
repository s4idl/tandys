import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MarketMap from './features/map/marketMap';
import Navbar from './features/ui/Navbar';
import RequestModal from './features/ui/RequestModal';
import Solicitudes from './pages/Solicitudes/Solicitudes';
import MisMarcas from './pages/miMarca/MisMarcas';
import Pagos from './pages/pagos/Pagos';
import { useUserStore } from './store/userStore';
import './App.css';



// ─── Map root page ────────────────────────────────────────────────────────────
const MapPage = () => {
  // Role pulled from global store — shared with all inner pages
  const { userType, setUserType } = useUserStore();
  const navigate = useNavigate();

  const isAdmin = userType === 'admin';

  return (
    <div className="map-root">
      {/* Full-screen canvas */}
      <div className="canvas-layer">
        <MarketMap isAdmin={isAdmin} />
      </div>

      {/* Floating tab bar + fixed logo */}
      <Navbar userType={userType} onUserTypeChange={setUserType} />

      {/* Top-right Registrar Marca button — redirects to Mis Marcas with state */}
      <button
        className="btn-registrar-marca-fixed"
        onClick={() => navigate('/mi-marca', { state: { autoOpenWizard: true } })}
      >
        Registrar Marca
      </button>

      {/* Request modal — self-renders when an available space is selected */}
      <RequestModal isAdmin={isAdmin} />
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
      <Navbar userType={userType} onUserTypeChange={setUserType} />
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/solicitudes" element={<InnerShell><Solicitudes /></InnerShell>} />
        <Route path="/pagos" element={<InnerShell><Pagos /></InnerShell>} />
        <Route path="/mi-marca" element={<InnerShell><MisMarcas /></InnerShell>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
