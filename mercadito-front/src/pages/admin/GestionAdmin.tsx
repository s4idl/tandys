import React, { useState, useEffect } from 'react';
import { FileText, Check, X, ExternalLink, Image as ImageIcon, ClipboardList, Map, Store, User } from 'lucide-react';
import api from '../../services/axios';
import './GestionAdmin.css';

// ─── TYPES ────────────────────────────────────────────────────────
interface MarcaAdmin {
  id_marca: number; 
  nombre_marca: string;
  descripcion?: string | null;
  categoria?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  logo_url?: string | null;
  fecha_creacion?: string | null;
}

interface SolicitudAdmin {
  id_solicitud: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha_solicitud: string;
  comentario_admin: string | null;
  marcas: MarcaAdmin;
  espacios: { id_espacio: number; numero_espacio: string; precio: number };
}

interface PagoAdmin {
  id_pago: number;
  id_solicitud: number;
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
  estado: 'pendiente' | 'verificado' | 'rechazado';
  referencia: string | null;
  solicitudes: {
    marcas: MarcaAdmin;
    espacios: { numero_espacio: string, precio: number };
  };
  comprobantes: {
    archivo_url: string;
  } | null;
}

// ─── NO MOCK DATA ──────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom';
import { useMapStore } from '../../store/mapStore';

// ─── COMPONENT ────────────────────────────────────────────────────
const GestionAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'nuevas' | 'esperando' | 'pagos' | 'historial'>('nuevas');
  
  // Filtros
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [tipoEspacio, setTipoEspacio] = useState<'all' | 'premium' | 'estandar'>('all');
  
  // Data
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [pagos, setPagos] = useState<PagoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [rechazarSolId, setRechazarSolId] = useState<number | null>(null);
  const [rechazoComentario, setRechazoComentario] = useState('');
  const [marcaVisualizada, setMarcaVisualizada] = useState<MarcaAdmin | null>(null);
  
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);

  // ─── COMPUTED TIMELINE & FILTERS ────────────────────────────────
  const applyFilters = <T extends SolicitudAdmin | PagoAdmin>(list: T[], dateField: keyof T) => {
    let filtered = [...list];
    
    if (tipoEspacio === 'premium') {
      filtered = filtered.filter(item => {
        const precio = 'espacios' in item 
          ? Number(item.espacios.precio) 
          : Number((item as PagoAdmin).solicitudes.espacios.precio);
        return precio > 350;
      });
    } else if (tipoEspacio === 'estandar') {
      filtered = filtered.filter(item => {
        const precio = 'espacios' in item 
          ? Number(item.espacios.precio) 
          : Number((item as PagoAdmin).solicitudes.espacios.precio);
        return precio <= 350;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a[dateField] as unknown as string).getTime();
      const dateB = new Date(b[dateField] as unknown as string).getTime();
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const solicitudesNuevas = applyFilters(solicitudes.filter(s => s.estado === 'pendiente'), 'fecha_solicitud');
  
  const solicitudesEsperandoPago = applyFilters(solicitudes.filter(s => {
    if (s.estado !== 'aceptada') return false;
    const tienePagoEnProceso = pagos.some(p => p.id_solicitud === s.id_solicitud && (p.estado === 'pendiente' || p.estado === 'verificado'));
    return !tienePagoEnProceso;
  }), 'fecha_solicitud');

  const pagosPorRevisar = applyFilters(pagos.filter(p => p.estado === 'pendiente'), 'fecha_pago');

  const historialRechazadas = applyFilters(solicitudes.filter(s => s.estado === 'rechazada'), 'fecha_solicitud');
  const historialPagosVerificados = applyFilters(pagos.filter(p => p.estado === 'verificado'), 'fecha_pago');

  // Ver en mapa action
  const handleVerEnMapa = (numeroEspacio: string) => {
    const spaces = useMapStore.getState().spaces;
    const target = spaces.find(s => s.id === numeroEspacio || s.label === numeroEspacio || s.name === numeroEspacio);
    if (target) {
      useMapStore.getState().selectSpace(target);
      navigate('/');
    } else {
      alert('El espacio no se pudo encontrar en el mapa actual.');
    }
  };

  // ─── FETCHING ───────────────────────────────────────────────────
  const fetchSolicitudes = async () => {
    try {
      const { data } = await api.get<SolicitudAdmin[]>('/solicitudes');
      setSolicitudes(data);
    } catch (error) {
      console.error('Error fetching solicitudes', error);
      setSolicitudes([]);
    }
  };

  const fetchPagos = async () => {
    try {
      const { data } = await api.get<PagoAdmin[]>('/pagos');
      setPagos(data);
    } catch (error) {
      console.error('Error fetching pagos', error);
      setPagos([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSolicitudes(), fetchPagos()]);
    setLoading(false);
  };

  useEffect(() => {
    const runLoad = async () => {
        await loadData();
    };
    runLoad();
  }, []);

  // ─── ACTIONS: SOLICITUDES ───────────────────────────────────────
  const handleAceptarSolicitud = async (id: number) => {
    try {
      await api.patch(`/solicitudes/${id}/aceptar`);
      fetchSolicitudes();
    } catch (error) {
      console.error('Error al aceptar solicitud', error);
      setSolicitudes(prev => prev.map(s => s.id_solicitud === id ? { ...s, estado: 'aceptada' } : s));
    }
  };

  const handleRechazarSolicitud = async () => {
    if (!rechazarSolId) return;
    try {
      await api.patch(`/solicitudes/${rechazarSolId}/rechazar`, {
        comentario_admin: rechazoComentario
      });
      fetchSolicitudes();
    } catch (error) {
      console.error('Error al rechazar solicitud', error);
      setSolicitudes(prev => prev.map(s => s.id_solicitud === rechazarSolId ? { ...s, estado: 'rechazada', comentario_admin: rechazoComentario } : s));
    } finally {
      setRechazarSolId(null);
      setRechazoComentario('');
    }
  };

  // ─── ACTIONS: PAGOS ─────────────────────────────────────────────
  const handleVerificarPago = async (id: number, estado: 'verificado' | 'rechazado') => {
    if (estado === 'rechazado') {
      const confirm = window.confirm('¿Estás seguro de rechazar este pago? Esto liberará el espacio y rechazará la solicitud.');
      if (!confirm) return;
    }

    try {
      await api.patch(`/pagos/${id}/verificar`, { estado });
      loadData();
    } catch (error) {
      console.error(`Error al marcar el pago como ${estado}`, error);
      setPagos(prev => prev.map(p => p.id_pago === id ? { ...p, estado } : p));
      if (estado === 'rechazado') {
        const pago = pagos.find(p => p.id_pago === id);
        if (pago) {
          setSolicitudes(prev => prev.map(s => s.id_solicitud === pago.id_solicitud ? { ...s, estado: 'rechazada' } : s));
        }
      }
    }
  };

  // ─── RENDER ─────────────────────────────────────────────────────
  
  const bubbleStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: isActive ? '1px solid transparent' : '1px solid #cbd5e1',
    background: isActive ? '#1e293b' : '#f8fafc',
    color: isActive ? '#fff' : '#64748b',
    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
  });

  return (
    <div className="gestion-root">
      <div className="gestion-bg-blob gestion-bg-blob--1" />
      <div className="gestion-bg-blob gestion-bg-blob--2" />

      <div className="gestion-container">
        <header className="gestion-header">
          <div className="gestion-header-wrap">
            <div className="gestion-header-icon">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="gestion-title">Gestión</h1>
              <p className="gestion-subtitle">Gestiona las solicitudes, pagos y registro de las marcas.</p>
            </div>
          </div>
        </header>

        {/* Header Tabs Container - Separating Historial completely */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          
          {/* Timeline format */}
          <div className="gestion-tabs" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', margin: 0 }}>
            <button 
              className={`gestion-tab ${activeTab === 'nuevas' ? 'active' : ''}`}
              onClick={() => setActiveTab('nuevas')}
            >
              1. Nuevas Solicitudes ({solicitudesNuevas.length})
            </button>
            <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontWeight: 800 }}>→</div>
            <button 
              className={`gestion-tab ${activeTab === 'esperando' ? 'active' : ''}`}
              onClick={() => setActiveTab('esperando')}
            >
              2. Esperando Pago ({solicitudesEsperandoPago.length})
            </button>
            <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontWeight: 800 }}>→</div>
            <button 
              className={`gestion-tab ${activeTab === 'pagos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pagos')}
            >
              3. Pagos por Revisar ({pagosPorRevisar.length})
            </button>
          </div>

          {/* Historial Tab pushed to the right, independent design */}
          <button 
            onClick={() => setActiveTab('historial')}
            style={{ 
              padding: '10px 24px', 
              borderRadius: '99px', 
              fontSize: '14px', 
              fontWeight: 700, 
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              background: activeTab === 'historial' ? '#1e293b' : '#fff', 
              color: activeTab === 'historial' ? '#fff' : '#64748b',
              border: activeTab === 'historial' ? 'none' : '1px solid #cbd5e1',
              boxShadow: activeTab === 'historial' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.02)' 
            }}
          >
            Historial / Rechazadas
          </button>
        </div>

        {/* Filters - Burbujitas */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, padding: '12px 16px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 16, borderRight: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros:</span>
            
            <button 
              style={bubbleStyle(sortOrder === 'recent')}
              onClick={() => setSortOrder('recent')}
            >
              Más recientes
            </button>
            <button 
              style={bubbleStyle(sortOrder === 'oldest')}
              onClick={() => setSortOrder('oldest')}
            >
              Más antiguas
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              style={bubbleStyle(tipoEspacio === 'all')}
              onClick={() => setTipoEspacio('all')}
            >
              Todos
            </button>
            <button 
              style={bubbleStyle(tipoEspacio === 'premium')}
              onClick={() => setTipoEspacio('premium')}
            >
              Premium
            </button>
            <button 
              style={bubbleStyle(tipoEspacio === 'estandar')}
              onClick={() => setTipoEspacio('estandar')}
            >
              Estándar
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Cargando información...
          </div>
        ) : (
          <div className="gestion-list">
            
            {/* ── 1. LISTA DE NUEVAS SOLICITUDES ── */}
            {activeTab === 'nuevas' && (
              solicitudesNuevas.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  No hay nuevas solicitudes pendientes de revisión.
                </div>
              ) : (
                solicitudesNuevas.map(sol => {
                  const isPremium = Number(sol.espacios.precio) > 350;
                  return (
                    <div key={sol.id_solicitud} className="gestion-card">
                      <div className="gestion-card-header">
                        <div className="gestion-card-title">
                          <FileText size={20} color="#7b1430" />
                          <span>{sol.marcas.nombre_marca}</span>
                        </div>
                        <span className={`gestion-badge ${sol.estado}`}>
                          Por Aprobar
                        </span>
                      </div>

                      <div className="gestion-card-body">
                        <div className="gestion-info-group">
                          <span className="gestion-info-label">Espacio Solicitado</span>
                          <span className="gestion-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {sol.espacios.numero_espacio}
                            <span style={{ 
                              fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, 
                              background: isPremium ? '#fef3c7' : '#f1f5f9', 
                              color: isPremium ? '#d97706' : '#64748b', border: isPremium ? '1px solid #fde68a' : '1px solid #e2e8f0' 
                            }}>
                              {isPremium ? 'Premium' : 'Estándar'}
                            </span>
                          </span>
                        </div>
                        <div className="gestion-info-group">
                          <span className="gestion-info-label">Fecha Solicitud</span>
                          <span className="gestion-info-value">
                            {new Date(sol.fecha_solicitud).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                        <div className="gestion-info-group">
                          <span className="gestion-info-label">Costo a cobrar</span>
                          <span className="gestion-info-value">${Number(sol.espacios.precio).toLocaleString('es-MX')} MXN</span>
                        </div>
                      </div>

                      <div className="gestion-card-actions">
                        <button className="gestion-btn gestion-btn-outline" onClick={() => setMarcaVisualizada(sol.marcas)}>
                          <User size={16} /> Ver Marca
                        </button>
                        <button className="gestion-btn gestion-btn-outline" onClick={() => handleVerEnMapa(sol.espacios.numero_espacio)}>
                          <Map size={16} /> Mapa
                        </button>
                        <button className="gestion-btn gestion-btn-reject" onClick={() => setRechazarSolId(sol.id_solicitud)}>
                          <X size={16} /> Rechazar
                        </button>
                        <button className="gestion-btn gestion-btn-accept" onClick={() => handleAceptarSolicitud(sol.id_solicitud)}>
                          <Check size={16} /> Aprobar
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* ── 2. LISTA DE ESPERANDO PAGO ── */}
            {activeTab === 'esperando' && (
              solicitudesEsperandoPago.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  No hay marcas con pago pendiente en este momento.
                </div>
              ) : (
                solicitudesEsperandoPago.map(sol => {
                  const isPremium = Number(sol.espacios.precio) > 350;
                  return (
                    <div key={sol.id_solicitud} className="gestion-card" style={{ opacity: 0.9 }}>
                      <div className="gestion-card-header">
                        <div className="gestion-card-title">
                          <FileText size={20} color="#10b981" />
                          <span>Marca Aprobada - {sol.marcas.nombre_marca}</span>
                        </div>
                        <span className="gestion-badge pendiente" style={{ background: '#f1f5f9', color: '#64748b' }}>
                          En espera de pago
                        </span>
                      </div>

                      <div className="gestion-card-body">
                        <div className="gestion-info-group">
                          <span className="gestion-info-label">Espacio Apartado</span>
                          <span className="gestion-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {sol.espacios.numero_espacio}
                            <span style={{ 
                              fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, 
                              background: isPremium ? '#fef3c7' : '#f1f5f9', 
                              color: isPremium ? '#d97706' : '#64748b', border: isPremium ? '1px solid #fde68a' : '1px solid #e2e8f0' 
                            }}>
                              {isPremium ? 'Premium' : 'Estándar'}
                            </span>
                          </span>
                        </div>
                        <div className="gestion-info-group">
                          <span className="gestion-info-label">Monto Esperado</span>
                          <span className="gestion-info-value">${Number(sol.espacios.precio).toLocaleString('es-MX')} MXN</span>
                        </div>
                        <div className="gestion-info-group">
                          <span className="gestion-info-label">Estatus del usuario</span>
                          <span className="gestion-info-value" style={{ color: '#ea580c' }}>El botón de pagar está habilitado para ellos.</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* ── 3. LISTA DE PAGOS POR REVISAR ── */}
            {activeTab === 'pagos' && (
              pagosPorRevisar.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  No hay pagos nuevos por verificar.
                </div>
              ) : (
                pagosPorRevisar.map(pago => (
                  <div key={pago.id_pago} className="gestion-card">
                    <div className="gestion-card-header">
                      <div className="gestion-card-title">
                        <ClipboardList size={20} color="#1e3a5f" />
                        Pago de: {pago.solicitudes.marcas.nombre_marca}
                      </div>
                      <span className="gestion-badge pendiente">
                        Por Verificar
                      </span>
                    </div>

                    <div className="gestion-card-body">
                      <div className="gestion-info-group">
                        <span className="gestion-info-label">Espacio</span>
                        <span className="gestion-info-value">{pago.solicitudes.espacios.numero_espacio}</span>
                      </div>
                      <div className="gestion-info-group">
                        <span className="gestion-info-label">Monto Reportado</span>
                        <span className="gestion-info-value">${Number(pago.monto).toLocaleString('es-MX')} MXN</span>
                      </div>
                      <div className="gestion-info-group">
                        <span className="gestion-info-label">Método</span>
                        <span className="gestion-info-value" style={{textTransform: 'capitalize'}}>{pago.metodo_pago}</span>
                      </div>
                      {pago.referencia && (
                        <div className="gestion-info-group">
                          <span className="gestion-info-label">Referencia</span>
                          <span className="gestion-info-value">{pago.referencia}</span>
                        </div>
                      )}
                    </div>

                    <div className="gestion-card-actions" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="gestion-btn gestion-btn-outline" onClick={() => setMarcaVisualizada(pago.solicitudes.marcas)}>
                          <User size={16} /> Marca
                        </button>
                        <button className="gestion-btn gestion-btn-outline" onClick={() => handleVerEnMapa(pago.solicitudes.espacios.numero_espacio)}>
                          <Map size={16} /> Mapa
                        </button>
                        {pago.comprobantes?.archivo_url ? (
                          <button 
                            className="gestion-btn gestion-btn-outline"
                            onClick={() => setComprobanteUrl(pago.comprobantes!.archivo_url)}
                          >
                            <ImageIcon size={16} /> Ver Comprobante
                          </button>
                        ) : (
                          <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Sin comprobante</span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="gestion-btn gestion-btn-reject" onClick={() => handleVerificarPago(pago.id_pago, 'rechazado')}>
                          <X size={16} /> Rechazar Pago
                        </button>
                        <button className="gestion-btn gestion-btn-accept" onClick={() => handleVerificarPago(pago.id_pago, 'verificado')}>
                          <Check size={16} /> Aprobar y Confirmar Espacio
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* ── 4. LISTA HISTORIAL / RECHAZADAS ── */}
            {activeTab === 'historial' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Solicitudes Rechazadas</h3>
                  {historialRechazadas.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '12px' }}>No hay solicitudes rechazadas.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {historialRechazadas.map(sol => {
                        const isPremium = Number(sol.espacios.precio) > 350;
                        return (
                          <div key={sol.id_solicitud} className="gestion-card" style={{ opacity: 0.85 }}>
                            <div className="gestion-card-header">
                              <div className="gestion-card-title">
                                <FileText size={20} color="#dc2626" />
                                Solicitud Rechazada - {sol.marcas.nombre_marca}
                              </div>
                              <span className="gestion-badge rechazada">Rechazada</span>
                            </div>
                            <div className="gestion-card-body">
                              <div className="gestion-info-group">
                                <span className="gestion-info-label">Espacio Solicitado</span>
                                <span className="gestion-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {sol.espacios.numero_espacio}
                                  <span style={{ 
                                    fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, 
                                    background: isPremium ? '#fef3c7' : '#f1f5f9', 
                                    color: isPremium ? '#d97706' : '#64748b', border: isPremium ? '1px solid #fde68a' : '1px solid #e2e8f0' 
                                  }}>
                                    {isPremium ? 'Premium' : 'Estándar'}
                                  </span>
                                </span>
                              </div>
                              <div className="gestion-info-group">
                                <span className="gestion-info-label">Motivo de Rechazo</span>
                                <span className="gestion-info-value" style={{ fontStyle: 'italic', color: '#64748b' }}>
                                  "{sol.comentario_admin || 'Sin comentario especificado'}"
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>Pagos Verificados (Espacios Confirmados)</h3>
                  {historialPagosVerificados.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: '12px' }}>No hay pagos verificados aún.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {historialPagosVerificados.map(pago => {
                        const isPremium = Number(pago.solicitudes.espacios.precio) > 350;
                        return (
                          <div key={pago.id_pago} className="gestion-card">
                            <div className="gestion-card-header">
                              <div className="gestion-card-title">
                                <Check size={20} color="#16a34a" />
                                Pago Verificado - {pago.solicitudes.marcas.nombre_marca}
                              </div>
                              <span className="gestion-badge verificado">Aprobado</span>
                            </div>
                            <div className="gestion-card-body">
                              <div className="gestion-info-group">
                                <span className="gestion-info-label">Espacio</span>
                                <span className="gestion-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {pago.solicitudes.espacios.numero_espacio}
                                  <span style={{ 
                                    fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, 
                                    background: isPremium ? '#fef3c7' : '#f1f5f9', 
                                    color: isPremium ? '#d97706' : '#64748b', border: isPremium ? '1px solid #fde68a' : '1px solid #e2e8f0' 
                                  }}>
                                    {isPremium ? 'Premium' : 'Estándar'}
                                  </span>
                                </span>
                              </div>
                              <div className="gestion-info-group">
                                <span className="gestion-info-label">Monto Pagado</span>
                                <span className="gestion-info-value">${Number(pago.monto).toLocaleString('es-MX')} MXN</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* Modal Rechazar Solicitud */}
      {rechazarSolId && (
        <div className="gestion-modal-overlay" onClick={() => setRechazarSolId(null)}>
          <div className="gestion-modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="gestion-title" style={{ fontSize: 20 }}>Rechazar Solicitud</h2>
            <p className="gestion-subtitle" style={{ marginBottom: 16 }}>
              Por favor indica el motivo del rechazo. Este mensaje lo verá la marca.
            </p>
            <textarea 
              className="gestion-textarea"
              placeholder="Ej: El giro de la marca no corresponde al evento..."
              value={rechazoComentario}
              onChange={(e) => setRechazoComentario(e.target.value)}
            />
            <div className="gestion-modal-actions">
              <button className="gestion-btn gestion-btn-outline" onClick={() => setRechazarSolId(null)}>Cancelar</button>
              <button className="gestion-btn gestion-btn-reject" onClick={handleRechazarSolicitud}>Confirmar Rechazo</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles de Marca (Wizard Style) */}
      {marcaVisualizada && (
        <div className="gestion-modal-overlay" onClick={() => setMarcaVisualizada(null)}>
          <div className="gestion-brand-modal" onClick={e => e.stopPropagation()}>
            <button className="gestion-brand-close" onClick={() => setMarcaVisualizada(null)}>
              <X size={16} />
            </button>
            
            {/* Left Panel */}
            <div className="gestion-brand-left">
              <div className="gestion-brand-icon">
                <Store size={22} />
              </div>
              <h1 className="gestion-brand-left-title">Detalles de<br />la Marca</h1>
              <p className="gestion-brand-left-sub">Perfil registrado en la plataforma.</p>
              
              <div className="gestion-brand-avatar">
                {marcaVisualizada.logo_url ? (
                  <img src={marcaVisualizada.logo_url} alt="Logo" className="gestion-brand-avatar-img" />
                ) : (
                  <div className="gestion-brand-avatar-placeholder">
                    {marcaVisualizada.nombre_marca.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'}
                  </div>
                )}
                <span className="gestion-brand-avatar-name">{marcaVisualizada.nombre_marca}</span>
              </div>
            </div>

            {/* Right Panel */}
            <div className="gestion-brand-right">
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 24px 0' }}>Información Comercial</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="gestion-info-group">
                  <span className="gestion-info-label">Nombre Comercial</span>
                  <span className="gestion-info-value" style={{ fontSize: 18, fontWeight: 700 }}>{marcaVisualizada.nombre_marca}</span>
                </div>

                <div className="gestion-info-group">
                  <span className="gestion-info-label">Categoría Principal</span>
                  <span className="gestion-info-value">{marcaVisualizada.categoria || 'Sin categoría especificada'}</span>
                </div>

                <div className="gestion-info-group">
                  <span className="gestion-info-label">Descripción del Negocio</span>
                  <span className="gestion-info-value" style={{ lineHeight: 1.6, color: '#475569' }}>
                    {marcaVisualizada.descripcion || 'Esta marca aún no ha proporcionado una descripción detallada de sus productos o historia.'}
                  </span>
                </div>

                <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }} />

                <div className="gestion-info-group">
                  <span className="gestion-info-label">Redes Sociales (Enlaces)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {marcaVisualizada.instagram ? (
                      <a href={`https://instagram.com/${marcaVisualizada.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ExternalLink size={16} />
                        </div>
                        Instagram: {marcaVisualizada.instagram}
                      </a>
                    ) : null}
                    
                    {marcaVisualizada.facebook ? (
                      <a href={`https://facebook.com/${marcaVisualizada.facebook}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ExternalLink size={16} />
                        </div>
                        Facebook: {marcaVisualizada.facebook}
                      </a>
                    ) : null}

                    {marcaVisualizada.tiktok ? (
                      <a href={`https://tiktok.com/${marcaVisualizada.tiktok}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b', textDecoration: 'none', fontWeight: 600 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ExternalLink size={16} />
                        </div>
                        TikTok: {marcaVisualizada.tiktok}
                      </a>
                    ) : null}

                    {!marcaVisualizada.instagram && !marcaVisualizada.facebook && !marcaVisualizada.tiktok && (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 14 }}>No hay redes sociales registradas.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Comprobante */}
      {comprobanteUrl && (
        <div className="gestion-modal-overlay" onClick={() => setComprobanteUrl(null)}>
          <div className="gestion-modal-card" style={{ maxWidth: 600, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="gestion-title" style={{ fontSize: 18, margin: 0 }}>Comprobante de Pago</h2>
              <button className="gestion-btn gestion-btn-outline" style={{ padding: '4px 8px' }} onClick={() => setComprobanteUrl(null)}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ width: '100%', height: 'auto', maxHeight: '70vh', overflow: 'auto', background: '#f8fafc', borderRadius: 12, display: 'flex', justifyContent: 'center' }}>
              {/* If it's an image */}
              <img 
                src={comprobanteUrl} 
                alt="Comprobante" 
                style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  // Fallback if not an image (e.g. PDF)
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `
                    <div style="padding: 40px; text-align: center;">
                      <p>Este archivo parece ser un documento (PDF u otro formato).</p>
                      <a href="${comprobanteUrl}" target="_blank" rel="noopener noreferrer" style="color: #7b1430; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                        Abrir archivo en nueva pestaña <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </a>
                    </div>
                  `;
                }}
              />
            </div>
            
            <div className="gestion-modal-actions" style={{ marginTop: 16 }}>
              <a 
                href={comprobanteUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="gestion-btn gestion-btn-outline"
              >
                <ExternalLink size={16} /> Abrir Original
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GestionAdmin;
