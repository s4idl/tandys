import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Store, CheckCircle, ChevronRight, RefreshCw, AlertCircle, Instagram, Facebook, Trash2 } from 'lucide-react';
import api from '../../services/axios';
import RegisterBrandWizard from '../../features/ui/RegisterBrandWizard';
import './MisMarcas.css';

// ── Types matching backend schema ─────────────────────────────────────────────
interface Marca {
  id_marca: number;
  nombre_marca: string;
  descripcion: string | null;
  logo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  fecha_creacion: string | null;
}

// ── TikTok icon (not in lucide) ────────────────────────────────────────────────
const TikTokIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z"/>
  </svg>
);

// ── Brand avatar (iniciales o logo) ───────────────────────────────────────────
const brandColors = [
  '#7b1430', '#16a34a', '#db2777', '#7c3aed',
  '#ea580c', '#0284c7', '#0f766e', '#b45309',
];

function getColorForId(id: number): string {
  return brandColors[id % brandColors.length];
}

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const BrandAvatar: React.FC<{ marca: Marca }> = ({ marca }) => {
  const color = getColorForId(marca.id_marca);
  const iniciales = getInitials(marca.nombre_marca);

  if (marca.logo_url) {
    return (
      <img
        src={marca.logo_url}
        alt={marca.nombre_marca}
        className="mm-avatar mm-avatar--img"
      />
    );
  }

  return (
    <div
      className="mm-avatar"
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        border: `2px solid ${color}55`,
      }}
    >
      <span style={{ color }}>{iniciales}</span>
    </div>
  );
};

// ── Brand card ─────────────────────────────────────────────────────────────────
const MarcaCard: React.FC<{ marca: Marca; onEdit: (marca: Marca) => void; onDelete: (marca: Marca) => void }> = ({ marca, onEdit, onDelete }) => {
  const color = getColorForId(marca.id_marca);

  return (
    <div className="mm-brand-card">
      <div className="mm-brand-card-inner">
        <div className="mm-brand-card-header">
          <BrandAvatar marca={marca} />
          {/* Sin estado en backend aún — todas las marcas registradas se muestran como activas */}
          <div className="mm-header-badges">
            <span className="mm-badge mm-badge--activo">
              <CheckCircle size={12} /> Activa
            </span>
            <button className="mm-delete-badge-btn" onClick={() => onDelete(marca)} aria-label="Eliminar marca">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <div className="mm-brand-info">
          <h3 className="mm-brand-name">{marca.nombre_marca}</h3>
          {marca.descripcion && (
            <p className="mm-brand-desc">{marca.descripcion}</p>
          )}
          <div className="mm-brand-socials">
            {marca.instagram && (
              <span className="mm-social-tag mm-social-tag--ig">
                <Instagram size={12} /> {marca.instagram}
              </span>
            )}
            {marca.tiktok && (
              <span className="mm-social-tag mm-social-tag--tiktok">
                <TikTokIcon /> {marca.tiktok}
              </span>
            )}
            {marca.facebook && (
              <span className="mm-social-tag mm-social-tag--fb">
                <Facebook size={12} /> {marca.facebook}
              </span>
            )}
          </div>
        </div>
        <button
          className="mm-edit-btn"
          onClick={() => onEdit(marca)}
          id={`edit-marca-${marca.id_marca}`}
        >
          <Edit3 size={14} />
          Editar Perfil
        </button>
      </div>
      <div className="mm-brand-card-glow" style={{ '--glow-color': color } as React.CSSProperties} />
    </div>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onRegistrar: () => void }> = ({ onRegistrar }) => (
  <div className="mm-empty">
    <div className="mm-empty-icon">🏪</div>
    <h3>Aún no tienes marcas registradas</h3>
    <p>Registra tu primer negocio para empezar a aparecer en el mercado Tandys.</p>
    <button className="mm-empty-cta" onClick={onRegistrar} id="btn-empty-registrar">
      <Plus size={16} />
      Registrar mi primera marca
    </button>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────────
const MisMarcas: React.FC = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [deletingMarca, setDeletingMarca] = useState<Marca | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const fetchMarcas = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Marca[]>('/marcas/mias');
      setMarcas(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar tus marcas. Verifica tu conexión.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  useEffect(() => {
    // If redirected from map with intention to register a brand
    if (location.state?.autoOpenWizard) {
      setShowWizard(true);
      // Clean up the state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleRegistrarMarca = () => setShowWizard(true);

  const handleWizardSuccess = () => {
    // Refresh the brands list after a successful registration
    fetchMarcas();
  };

  const handleEditarMarca = (marca: Marca) => {
    setEditingMarca(marca);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingMarca(null);
  };

  const confirmDelete = async () => {
    if (!deletingMarca) return;
    try {
      await api.delete(`/marcas/${deletingMarca.id_marca}`);
      setMarcas((prev) => prev.filter((m) => m.id_marca !== deletingMarca.id_marca));
      setDeletingMarca(null);
    } catch (err) {
      console.error('Error deleting brand:', err);
    }
  };

  return (
    <div className="mm-root">
      {/* Background decoration */}
      <div className="mm-bg-blob mm-bg-blob--1" />
      <div className="mm-bg-blob mm-bg-blob--2" />

      <div className="mm-container">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="mm-header">
          <div className="mm-header-icon">
            <Store size={28} />
          </div>
          <div>
            <h1 className="mm-title">Mi Marca</h1>
            <p className="mm-subtitle">
              Gestiona tus negocios registrados en Tandys
            </p>
          </div>
          {!loading && !error && marcas.length > 0 && (
            <div className="mm-header-count">
              <span>{marcas.length}</span>
              <small>registradas</small>
            </div>
          )}
        </header>

        {/* ── Action card ─────────────────────────────────────────────────── */}
        <section className="mm-actions" aria-label="Acciones">
          <button
            className="mm-action-card mm-action-card--primary"
            onClick={handleRegistrarMarca}
            id="btn-registrar-marca"
          >
            <div className="mm-action-icon-wrap mm-action-icon-wrap--primary">
              <Plus size={22} strokeWidth={2.5} />
            </div>
            <div className="mm-action-text">
              <span className="mm-action-label">Registrar Marca</span>
              <span className="mm-action-desc">Añade un nuevo negocio</span>
            </div>
            <ChevronRight size={18} className="mm-action-arrow" />
          </button>
        </section>

        {/* ── Content area ────────────────────────────────────────────────── */}

        {/* Loading skeleton */}
        {loading && (
          <div className="mm-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="mm-skeleton-card">
                <div className="mm-skeleton mm-skeleton--avatar" />
                <div className="mm-skeleton mm-skeleton--line mm-skeleton--title" />
                <div className="mm-skeleton mm-skeleton--line mm-skeleton--sub" />
                <div className="mm-skeleton mm-skeleton--btn" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="mm-error">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button className="mm-retry-btn" onClick={fetchMarcas} id="btn-retry">
              <RefreshCw size={14} />
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && marcas.length === 0 && (
          <EmptyState onRegistrar={handleRegistrarMarca} />
        )}

        {/* Brand grid */}
        {!loading && !error && marcas.length > 0 && (
          <section aria-label="Tus marcas">
            <div className="mm-section-label">
              <span>Tus marcas</span>
              <hr className="mm-section-hr" />
            </div>
            <div className="mm-grid">
              {marcas.map((marca) => (
                <MarcaCard
                  key={marca.id_marca}
                  marca={marca}
                  onEdit={handleEditarMarca}
                  onDelete={setDeletingMarca}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── Register/Edit Brand Wizard ─────────────────────────────────── */}
      {(showWizard || editingMarca) && (
        <RegisterBrandWizard
          marcaToEdit={editingMarca || undefined}
          onClose={handleCloseWizard}
          onSuccess={handleWizardSuccess}
        />
      )}

      {/* ── Custom Delete Confirmation Modal ───────────────────────────── */}
      {deletingMarca && (
        <div className="rbw-overlay">
          <div className="rbw-modal rbw-modal--success" style={{ width: '400px', gap: '8px' }}>
            <div className="rbw-warning-icon" style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '50%', marginBottom: '4px' }}>
              <Trash2 size={32} />
            </div>
            <h2>Eliminar Marca</h2>
            <p>¿Estás seguro de que quieres eliminar <strong>{deletingMarca.nombre_marca}</strong>? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
              <button 
                style={{ flex: 1, padding: '12px', textAlign: 'center', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => setDeletingMarca(null)}
              >Cancelar</button>
              <button 
                style={{ flex: 1, padding: '12px', textAlign: 'center', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={confirmDelete}
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisMarcas;
