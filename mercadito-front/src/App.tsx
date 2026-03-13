import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MarketMap from './features/map/marketMap';
import Sidebar from './features/ui/Sidebar';
import RequestModal from './features/ui/RequestModal';
import RegisterBrandModal from './features/ui/RegisterBrandModal';
import './App.css';

// ─── Placeholder pages ────────────────────────────────────────────────────────
const Solicitudes = () => (
  <div className="inner-page">
    <h2>📂 Solicitudes</h2>
    <p>Próximamente: gestión de solicitudes de espacios.</p>
  </div>
);

const Pagos = () => (
  <div className="inner-page">
    <h2>💳 Mis Pagos</h2>
    <p>Próximamente: historial y gestión de pagos.</p>
  </div>
);

// ─── Map root page ────────────────────────────────────────────────────────────
const MapPage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRegisterBrand, setShowRegisterBrand] = useState(false);

  return (
    <div className="map-root">
      {/* Full-screen canvas */}
      <div className="canvas-layer">
        <MarketMap isAdmin={isAdmin} />
      </div>

      {/* Floating sidebar on top */}
      <Sidebar isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin((v) => !v)} />

      {/* Top-right Registrar Marca button */}
      <button
        className="btn-registrar-marca-fixed"
        onClick={() => setShowRegisterBrand(true)}
      >
        Registrar Marca
      </button>

      {/* Request modal — self-renders when an available space is selected */}
      <RequestModal />

      {/* Register brand modal */}
      {showRegisterBrand && (
        <RegisterBrandModal onClose={() => setShowRegisterBrand(false)} />
      )}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/pagos" element={<Pagos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
