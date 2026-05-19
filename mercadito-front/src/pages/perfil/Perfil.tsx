import React, { useEffect, useState } from 'react';
import {
  User,
  Store,
  ChevronRight,
  Instagram,
  Facebook,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Phone,
  RefreshCw,
  DollarSign,
  Tag,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/axios';
import './Perfil.css';

// ── TikTok icon ────────────────────────────────────────────────────────────────
const TikTokIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────────
interface Espacio {
  id_espacio: number;
  numero_espacio: string;
  precio: string;
  estado: string;
  mercaditos: {
    id_mercadito: number;
    nombre: string;
    fecha: string;
    lugar: string;
  };
}

interface Solicitud {
  id_solicitud: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha_solicitud: string;
  comentario_admin: string | null;
  espacios: Espacio;
}

interface Marca {
  id_marca: number;
  nombre_marca: string;
  descripcion: string | null;
  logo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  fecha_creacion: string | null;
  solicitudes: Solicitud[];
}

interface PerfilData {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  fecha_registro: string | null;
  marcas: Marca[];
}



// ── Helpers ────────────────────────────────────────────────────────────────────
const BRAND_COLORS = [
  '#7b1430', '#16a34a', '#db2777', '#7c3aed',
  '#ea580c', '#0284c7', '#0f766e', '#b45309',
];

function colorForId(id: number) {
  return BRAND_COLORS[id % BRAND_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function rolLabel(rol: string) {
  const map: Record<string, string> = {
    vendedor: 'Vendedor',
    visualizador: 'Visualizador',
    admin: 'Administrador',
  };
  return map[rol] ?? rol;
}

// ── Solicitud status chip ──────────────────────────────────────────────────────
const SolChip: React.FC<{ estado: Solicitud['estado'] }> = ({ estado }) => {
  const map = {
    pendiente: { label: 'Pendiente', cls: 'prf-sol-chip--pendiente' },
    aceptada:  { label: 'Aceptada',  cls: 'prf-sol-chip--aceptada'  },
    rechazada: { label: 'Rechazada', cls: 'prf-sol-chip--rechazada' },
  };
  const { label, cls } = map[estado] ?? map.pendiente;
  return <span className={`prf-sol-chip ${cls}`}>{label}</span>;
};

// ── Solicitud status icon ──────────────────────────────────────────────────────
const SolStatusIcon: React.FC<{ estado: Solicitud['estado'] }> = ({ estado }) => {
  const cls = `prf-sol-status-icon prf-sol-status-icon--${estado}`;
  if (estado === 'aceptada')  return <div className={cls}><CheckCircle size={18} /></div>;
  if (estado === 'rechazada') return <div className={cls}><XCircle size={18} /></div>;
  return <div className={cls}><Clock size={18} /></div>;
};

// ── Marca avatar ───────────────────────────────────────────────────────────────
const MarcaAvatar: React.FC<{ marca: Marca; size?: number; radius?: number }> = ({
  marca, size = 40, radius = 10,
}) => {
  const color = colorForId(marca.id_marca);
  if (marca.logo_url) {
    return (
      <div className="prf-marca-avatar" style={{ width: size, height: size, borderRadius: radius }}>
        <img src={marca.logo_url} alt={marca.nombre_marca} />
      </div>
    );
  }
  return (
    <div
      className="prf-marca-avatar"
      style={{
        width: size, height: size, borderRadius: radius,
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        border: `1.5px solid ${color}55`,
        fontSize: size * 0.32,
        color,
      }}
    >
      {initials(marca.nombre_marca)}
    </div>
  );
};

// ── Detail: Brand card ─────────────────────────────────────────────────────────
const BrandDetailCard: React.FC<{ marca: Marca }> = ({ marca }) => {
  const color = colorForId(marca.id_marca);
  return (
    <div className="prf-brand-card">
      <div className="prf-brand-header">
        <div
          className="prf-brand-logo"
          style={
            marca.logo_url ? {} : {
              background: `linear-gradient(135deg, ${color}22, ${color}44)`,
              border: `1.5px solid ${color}55`,
              color,
            }
          }
        >
          {marca.logo_url
            ? <img src={marca.logo_url} alt={marca.nombre_marca} />
            : initials(marca.nombre_marca)}
        </div>
        <div className="prf-brand-title">
          <h2 className="prf-brand-name">{marca.nombre_marca}</h2>
          {marca.descripcion && <p className="prf-brand-desc">{marca.descripcion}</p>}
        </div>
      </div>

      {(marca.instagram || marca.facebook || marca.tiktok) && (
        <div className="prf-socials">
          {marca.instagram && (
            <span className="prf-social prf-social--ig">
              <Instagram size={11} /> {marca.instagram}
            </span>
          )}
          {marca.facebook && (
            <span className="prf-social prf-social--fb">
              <Facebook size={11} /> {marca.facebook}
            </span>
          )}
          {marca.tiktok && (
            <span className="prf-social prf-social--tiktok">
              <TikTokIcon /> {marca.tiktok}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="prf-badge prf-badge--fecha">
          <Calendar size={10} /> Registrada: {formatDate(marca.fecha_creacion)}
        </span>
        {marca.solicitudes.length > 0 && (
          <span className="prf-badge prf-badge--rol">
            <Tag size={10} /> {marca.solicitudes.length} solicitud{marca.solicitudes.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Detail: Solicitudes ────────────────────────────────────────────────────────
const SolicitudesSection: React.FC<{ solicitudes: Solicitud[] }> = ({ solicitudes }) => (
  <div className="prf-sol-section">
    <div className="prf-section-header">
      <span className="prf-section-title">Solicitudes de espacio</span>
      <hr className="prf-section-hr" />
    </div>

    {solicitudes.length === 0 ? (
      <div className="prf-sol-empty">
        <div className="prf-sol-empty-icon">📋</div>
        <p>Esta marca aún no tiene solicitudes de espacio.</p>
      </div>
    ) : (
      <div className="prf-sol-list">
        {solicitudes.map((sol) => (
          <div key={sol.id_solicitud} className="prf-sol-card">
            <SolStatusIcon estado={sol.estado} />
            <div className="prf-sol-info">
              <div className="prf-sol-row">
                <span className="prf-sol-espacio">Espacio #{sol.espacios.numero_espacio}</span>
                <SolChip estado={sol.estado} />
              </div>
              <p className="prf-sol-mercadito">
                <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
                {sol.espacios.mercaditos.nombre} — {sol.espacios.mercaditos.lugar}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="prf-sol-precio">
                  <DollarSign size={11} style={{ display: 'inline' }} />
                  ${Number(sol.espacios.precio).toLocaleString('es-MX')} MXN
                </span>
                <span className="prf-sol-fecha">
                  <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />
                  Mercadito: {formatDate(sol.espacios.mercaditos.fecha)}
                </span>
              </div>
              <p className="prf-sol-fecha">Solicitado el {formatDate(sol.fecha_solicitud)}</p>
              {sol.comentario_admin && (
                <div className="prf-sol-comentario">
                  <strong>Comentario admin:</strong> {sol.comentario_admin}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────────
const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarcaId, setSelectedMarcaId] = useState<number | null>(null);

  const fetchPerfil = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: perfil } = await api.get<PerfilData>('/usuarios/me');
      setData(perfil);
      if (perfil.marcas.length > 0) setSelectedMarcaId(perfil.marcas[0].id_marca);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo cargar el perfil.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerfil(); }, []);

  const selectedMarca = data?.marcas.find((m) => m.id_marca === selectedMarcaId) ?? null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="prf-root">
        <div className="prf-blob prf-blob--1" />
        <div className="prf-blob prf-blob--2" />
        <div className="prf-content">
          <div className="prf-skeleton prf-skeleton-hero" />
          <div className="prf-skeleton-split">
            <div className="prf-skeleton prf-skeleton-left" />
            <div className="prf-skeleton prf-skeleton-right" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error (no debería mostrarse con mock) ────────────────────────────────────
  if (!data) {
    return (
      <div className="prf-root">
        <div className="prf-blob prf-blob--1" />
        <div className="prf-content">
          <div className="prf-error">
            <AlertCircle size={40} />
            <p>{error ?? 'Error desconocido'}</p>
            <button className="prf-retry-btn" onClick={fetchPerfil} id="btn-perfil-retry">
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="prf-root">
      <div className="prf-blob prf-blob--1" />
      <div className="prf-blob prf-blob--2" />

      <div className="prf-content">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="prf-hero">
          <div className="prf-avatar-wrap">
            <div className="prf-avatar" id="prf-user-avatar">
              {initials(data.nombre)}
            </div>
          </div>

          <div className="prf-hero-info">
            <h1 className="prf-hero-name" id="prf-user-name">{data.nombre}</h1>
            <p className="prf-hero-email">{data.correo}</p>
            <div className="prf-hero-badges">
              <span className="prf-badge prf-badge--rol">
                <User size={10} /> {rolLabel(data.rol)}
              </span>
              {data.activo && (
                <span className="prf-badge prf-badge--activo">
                  <CheckCircle size={10} /> Activo
                </span>
              )}
              {data.fecha_registro && (
                <span className="prf-badge prf-badge--fecha">
                  <Calendar size={10} /> Desde {formatDate(data.fecha_registro)}
                </span>
              )}
              {data.telefono && (
                <span className="prf-badge prf-badge--phone">
                  <Phone size={10} /> {data.telefono}
                </span>
              )}
            </div>
          </div>

          <div className="prf-hero-stats">
            <div className="prf-stat">
              <div className="prf-stat-val">{data.marcas.length}</div>
              <div className="prf-stat-lbl">Marca{data.marcas.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="prf-stat">
              <div className="prf-stat-val">
                {data.marcas.reduce((a, m) => a + m.solicitudes.length, 0)}
              </div>
              <div className="prf-stat-lbl">Solicitudes</div>
            </div>
          </div>
        </div>

        {/* ── Split ────────────────────────────────────────────────────────── */}
        <div className="prf-split">

          {/* Left — Marcas list */}
          <div>
            <div className="prf-section-header">
              <span className="prf-section-title">Mis Marcas</span>
              <hr className="prf-section-hr" />
              <button 
                className="prf-add-marca-btn"
                onClick={() => navigate('/mi-marca', { state: { autoOpenWizard: true } })}
                title="Registrar nueva marca"
              >
                <Plus size={14} /> Registrar Marca
              </button>
            </div>
            <div className="prf-marcas-panel">
              {data.marcas.length === 0 ? (
                <div className="prf-marcas-empty">
                  <div className="prf-marcas-empty-icon">🏪</div>
                  <p>Aún no tienes marcas registradas.</p>
                </div>
              ) : (
                <ul className="prf-marcas-list" role="listbox" aria-label="Lista de marcas">
                  {data.marcas.map((marca) => (
                    <li
                      key={marca.id_marca}
                      id={`prf-marca-item-${marca.id_marca}`}
                      className={`prf-marca-item${selectedMarcaId === marca.id_marca ? ' prf-marca-item--active' : ''}`}
                      onClick={() => setSelectedMarcaId(marca.id_marca)}
                      role="option"
                      aria-selected={selectedMarcaId === marca.id_marca}
                    >
                      <MarcaAvatar marca={marca} size={40} radius={10} />
                      <div className="prf-marca-item-info">
                        <div className="prf-marca-item-name">{marca.nombre_marca}</div>
                        <div className="prf-marca-item-meta">
                          <Store size={10} style={{ display: 'inline', marginRight: 3 }} />
                          Desde {formatDate(marca.fecha_creacion)}
                        </div>
                      </div>
                      {marca.solicitudes.length > 0 && (
                        <span className="prf-marca-sol-count">
                          {marca.solicitudes.length}
                        </span>
                      )}
                      <ChevronRight size={14} className="prf-marca-item-chevron" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right — Detail */}
          <div className="prf-detail-panel">
            {selectedMarca ? (
              <>
                <div className="prf-section-header">
                  <span className="prf-section-title">Detalle de marca</span>
                  <hr className="prf-section-hr" />
                </div>
                <BrandDetailCard marca={selectedMarca} />
                <SolicitudesSection solicitudes={selectedMarca.solicitudes} />
              </>
            ) : (
              <div className="prf-detail-empty">
                <div className="prf-detail-empty-icon">👈</div>
                <p>Selecciona una marca para ver su detalle</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Perfil;
