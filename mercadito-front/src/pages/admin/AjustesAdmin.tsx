import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, ShieldCheck, Trash2, Search, Store, ChevronRight, 
  Instagram, Facebook, Clock, CheckCircle, XCircle, MapPin, DollarSign, Calendar, User, Loader2, MousePointerClick
} from 'lucide-react';
import api from '../../services/axios';
import { useUserStore } from '../../store/userStore';
import './AjustesAdmin.css';
import type { Marca, Space } from '../../types';

// Extended type because GET /marcas now returns nested data
interface SolicitudNested {
  id_solicitud: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha_solicitud: string;
  comentario_admin: string | null;
  espacios: Space & {
    mercaditos: {
      nombre: string;
      lugar: string;
      fecha: string;
    }
  };
}

interface MarcaAdmin extends Marca {
  solicitudes: SolicitudNested[];
  usuarios?: {
    id_usuario: number;
    nombre: string;
    correo: string;
  };
}

interface PerfilData {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
}

// ── TikTok icon ────────────────────────────────────────────────────────────────
const TikTokIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
  </svg>
);

const BRAND_COLORS = [
  '#7b1430', '#16a34a', '#db2777', '#7c3aed',
  '#ea580c', '#0284c7', '#0f766e', '#b45309',
];

function colorForId(id: number) {
  return BRAND_COLORS[id % BRAND_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ── Solicitud status icon ──────────────────────────────────────────────────────
const SolStatusIcon: React.FC<{ estado: SolicitudNested['estado'] }> = ({ estado }) => {
  const cls = `adm-ajustes-sol-icon adm-ajustes-sol-icon--${estado}`;
  if (estado === 'aceptada')  return <div className={cls}><CheckCircle size={16} /></div>;
  if (estado === 'rechazada') return <div className={cls}><XCircle size={16} /></div>;
  return <div className={cls}><Clock size={16} /></div>;
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const AjustesAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilData | null>(null);
  const [marcas, setMarcas] = useState<MarcaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [selectedMarcaId, setSelectedMarcaId] = useState<number | null>(null);
  const [marcaToDelete, setMarcaToDelete] = useState<MarcaAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [perfilRes, marcasRes] = await Promise.all([
          api.get<PerfilData>('/usuarios/me'),
          api.get<MarcaAdmin[]>('/marcas')
        ]);
        setPerfil(perfilRes.data);
        setMarcas(marcasRes.data);
        if (marcasRes.data.length > 0) {
          setSelectedMarcaId(marcasRes.data[0].id_marca);
        }
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    useUserStore.getState().logout();
    navigate('/');
  };

  const handleConfirmDelete = async () => {
    if (!marcaToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/marcas/${marcaToDelete.id_marca}`);
      setMarcas(prev => prev.filter(m => m.id_marca !== marcaToDelete.id_marca));
      if (selectedMarcaId === marcaToDelete.id_marca) {
        setSelectedMarcaId(null);
      }
    } catch (err) {
      console.error('Error deleting brand', err);
      alert('Hubo un error al eliminar la marca.');
    } finally {
      setIsDeleting(false);
      setMarcaToDelete(null);
    }
  };

  const filteredMarcas = marcas.filter(m => 
    m.nombre_marca.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMarca = marcas.find(m => m.id_marca === selectedMarcaId) ?? null;

  if (loading) {
    return (
      <div className="adm-ajustes-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Cargando ajustes y expediente de marcas...</p>
      </div>
    );
  }

  return (
    <div className="adm-ajustes-root">
      <div className="adm-ajustes-blob adm-ajustes-blob--1" />
      <div className="adm-ajustes-blob adm-ajustes-blob--2" />

      <div className="adm-ajustes-content">
        
        {/* ── Perfil Admin ── */}
        {perfil && (
          <section className="adm-ajustes-hero">
            <div className="adm-ajustes-avatar">
              {initials(perfil.nombre)}
            </div>
            <h1 className="adm-ajustes-name">{perfil.nombre}</h1>
            <p className="adm-ajustes-email">{perfil.correo}</p>
            
            <div className="adm-ajustes-badges">
              <span className="adm-ajustes-badge adm-ajustes-badge--rol">
                <ShieldCheck size={12} /> {perfil.rol === 'admin' ? 'Administrador' : perfil.rol}
              </span>
              {perfil.activo && (
                <span className="adm-ajustes-badge adm-ajustes-badge--activo">
                  Activo
                </span>
              )}
            </div>

            <button className="adm-ajustes-logout-btn" onClick={handleLogout}>
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </section>
        )}

        {/* ── Split Layout: Moderación ── */}
        <div className="adm-ajustes-split">
          
          {/* Panel Izquierdo: Lista de Marcas */}
          <div className="adm-ajustes-left">
            <div className="adm-ajustes-section-header">
              <span className="adm-ajustes-section-title">Cuentas Registradas</span>
              <hr className="adm-ajustes-section-hr" />
            </div>

            <div className="adm-ajustes-search">
              <Search size={16} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Buscar marca..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredMarcas.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No hay marcas.</p>
            ) : (
              <ul className="adm-ajustes-marcas-list">
                {filteredMarcas.map(marca => (
                  <li 
                    key={marca.id_marca}
                    className={`adm-ajustes-marca-item ${selectedMarcaId === marca.id_marca ? 'adm-ajustes-marca-item--active' : ''}`}
                    onClick={() => setSelectedMarcaId(marca.id_marca)}
                  >
                    <div className="adm-ajustes-marca-avatar">
                      {marca.logo_url ? <img src={marca.logo_url} alt="Logo" /> : initials(marca.nombre_marca)}
                    </div>
                    <span className="adm-ajustes-marca-name">{marca.nombre_marca}</span>
                    <ChevronRight size={14} color="#94a3b8" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Panel Derecho: Expediente */}
          <div className="adm-ajustes-right">
            {selectedMarca ? (
              <>
                <div className="adm-ajustes-section-header">
                  <span className="adm-ajustes-section-title">Expediente de Marca</span>
                  <hr className="adm-ajustes-section-hr" />
                </div>

                {/* Info Card */}
                <div className="adm-ajustes-brand-card">
                  <div className="adm-ajustes-brand-header">
                    <div 
                      className="adm-ajustes-brand-logo"
                      style={
                        selectedMarca.logo_url ? {} : {
                          background: `linear-gradient(135deg, ${colorForId(selectedMarca.id_marca)}22, ${colorForId(selectedMarca.id_marca)}44)`,
                          border: `1px solid ${colorForId(selectedMarca.id_marca)}55`,
                          color: colorForId(selectedMarca.id_marca)
                        }
                      }
                    >
                      {selectedMarca.logo_url ? <img src={selectedMarca.logo_url} alt="Logo" /> : initials(selectedMarca.nombre_marca)}
                    </div>
                    <div className="adm-ajustes-brand-title">
                      <h2 className="adm-ajustes-brand-name">{selectedMarca.nombre_marca}</h2>
                      {selectedMarca.descripcion && <p className="adm-ajustes-brand-desc">{selectedMarca.descripcion}</p>}
                    </div>
                  </div>

                  {(selectedMarca.instagram || selectedMarca.facebook || selectedMarca.tiktok) && (
                    <div className="adm-ajustes-socials">
                      {selectedMarca.instagram && (
                        <span className="adm-ajustes-social adm-ajustes-social--ig"><Instagram size={11}/> {selectedMarca.instagram}</span>
                      )}
                      {selectedMarca.facebook && (
                        <span className="adm-ajustes-social adm-ajustes-social--fb"><Facebook size={11}/> {selectedMarca.facebook}</span>
                      )}
                      {selectedMarca.tiktok && (
                        <span className="adm-ajustes-social adm-ajustes-social--tiktok"><TikTokIcon/> {selectedMarca.tiktok}</span>
                      )}
                    </div>
                  )}

                  <div className="adm-ajustes-brand-meta">
                    <span className="adm-ajustes-badge-meta"><Calendar size={12}/> Registrada: {formatDate(selectedMarca.fecha_creacion)}</span>
                    <span className="adm-ajustes-badge-meta"><Store size={12}/> ID: {selectedMarca.id_marca}</span>
                    {selectedMarca.usuarios && (
                      <span className="adm-ajustes-badge-meta" style={{ background: 'rgba(15, 118, 110, 0.1)', color: '#0f766e' }}>
                        <User size={12} /> Dueño: {selectedMarca.usuarios.nombre} ({selectedMarca.usuarios.correo})
                      </span>
                    )}
                  </div>
                </div>

                {/* Solicitudes History */}
                <div>
                  <div className="adm-ajustes-section-header" style={{ marginTop: 16 }}>
                    <span className="adm-ajustes-section-title">Historial de Solicitudes</span>
                    <hr className="adm-ajustes-section-hr" />
                  </div>
                  
                  {(!selectedMarca.solicitudes || selectedMarca.solicitudes.length === 0) ? (
                    <div style={{ padding: 24, background: 'white', borderRadius: 16, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                      Esta marca no tiene solicitudes activas.
                    </div>
                  ) : (
                    <div className="adm-ajustes-sols">
                      {selectedMarca.solicitudes.map(sol => (
                        <div key={sol.id_solicitud} className="adm-ajustes-sol-card">
                          <SolStatusIcon estado={sol.estado} />
                          <div className="adm-ajustes-sol-info">
                            <div className="adm-ajustes-sol-row">
                              <span className="adm-ajustes-sol-esp">Espacio #{sol.espacios.numero_espacio}</span>
                              <span className={`adm-ajustes-sol-chip adm-ajustes-sol-chip--${sol.estado}`}>
                                {sol.estado === 'pendiente' ? 'En revisión' : sol.estado === 'aceptada' ? 'Aprobada' : 'Rechazada'}
                              </span>
                            </div>
                            <p className="adm-ajustes-sol-sub">
                              <MapPin size={12}/> {sol.espacios.mercaditos?.nombre ?? 'Mercadito'} — {sol.espacios.mercaditos?.lugar ?? ''}
                            </p>
                            <div className="adm-ajustes-sol-meta">
                              <span><DollarSign size={12} style={{display:'inline', marginBottom:-2}}/> ${Number(sol.espacios.precio).toLocaleString('es-MX')} MXN</span>
                              <span><Calendar size={12} style={{display:'inline', marginBottom:-2}}/> {formatDate(sol.fecha_solicitud)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="adm-ajustes-danger-zone">
                  <h3 className="adm-ajustes-danger-title">Zona de Peligro</h3>
                  <p className="adm-ajustes-danger-desc">
                    Eliminar la cuenta borra permanentemente su perfil, solicitudes, asignación de espacios y pagos registrados.
                  </p>
                  <button 
                    className="adm-ajustes-btn-danger"
                    onClick={() => setMarcaToDelete(selectedMarca)}
                  >
                    <Trash2 size={16} /> Eliminar Marca Permanentemente
                  </button>
                </div>

              </>
            ) : (
              <div className="adm-ajustes-detail-empty">
                <div style={{ marginBottom: 16, color: '#94a3b8' }}>
                  <MousePointerClick size={48} />
                </div>
                <p>Selecciona una marca del panel izquierdo para auditar su expediente completo antes de tomar decisiones.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal de Confirmación */}
      {marcaToDelete && (
        <div className="adm-ajustes-modal-overlay" onClick={() => setMarcaToDelete(null)}>
          <div className="adm-ajustes-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-ajustes-modal-icon">
              <Trash2 size={24} />
            </div>
            <h2 className="adm-ajustes-modal-title">¿Eliminar {marcaToDelete.nombre_marca}?</h2>
            <p className="adm-ajustes-modal-desc">
              Esta acción es irreversible y eliminará en cascada todas sus solicitudes y comprobantes del sistema.
            </p>
            <div className="adm-ajustes-modal-actions">
              <button 
                className="adm-ajustes-btn adm-ajustes-btn--cancel" 
                onClick={() => setMarcaToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                className="adm-ajustes-btn adm-ajustes-btn--danger" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isDeleting ? <><Loader2 size={16} className="spinner" /> Eliminando...</> : 'Sí, eliminar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AjustesAdmin;
