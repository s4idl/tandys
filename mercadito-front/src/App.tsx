import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MarketMap from './features/map/marketMap';
import Navbar from './features/ui/Navbar';
import type { UserType } from './features/ui/Navbar';
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
  const [userType, setUserType] = useState<UserType>('user');
  const [showRegisterBrand, setShowRegisterBrand] = useState(false);

  const isAdmin = userType === 'admin';

  return (
    <div className="map-root">
      {/* Full-screen canvas */}
      <div className="canvas-layer">
        <MarketMap isAdmin={isAdmin} />
      </div>

      {/* Floating tab bar + fixed logo */}
      <Navbar userType={userType} onUserTypeChange={setUserType} />

      {/* Top-right Registrar Marca button */}
      <button
        className="btn-registrar-marca-fixed"
        onClick={() => setShowRegisterBrand(true)}
      >
        Registrar Marca
      </button>

      {/* Request modal — self-renders when an available space is selected */}
      <RequestModal isAdmin={isAdmin} />

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
