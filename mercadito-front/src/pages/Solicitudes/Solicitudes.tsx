import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Map, FileText, Check, X, CreditCard } from 'lucide-react';
import api from '../../services/axios';
import './Solicitudes.css';

// Shape returned by GET /solicitudes/mias
interface Solicitud {
  id_solicitud: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha_solicitud: string;
  comentario_admin: string | null;
  marcas:   { id_marca: number; nombre_marca: string };
  espacios: { id_espacio: number; numero_espacio: string; precio: number };
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'En revisión',
  aceptada:  'Aprobada',
  rechazada: 'Rechazada',
};

const ESTADO_STYLE: Record<string, React.CSSProperties> = {
  pendiente: { backgroundColor: '#fff7ed', color: '#ea580c', borderColor: '#ffedd5' },
  aceptada:  { backgroundColor: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' },
  rechazada: { backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' },
};

const Solicitudes: React.FC = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [statusModal, setStatusModal] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<Solicitud[]>('/solicitudes/mias');
        setSolicitudes(data);
      } catch (err) {
        console.error('Error fetching solicitudes', err);
        setSolicitudes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitudes();
  }, []);

  const handleSolicitarEspacio = () => navigate('/');

  // Navigate to Pagos > SubirView pre-selecting this solicitud
  const handleIrAPagar = (sol: Solicitud) => {
    navigate('/pagos', { state: { view: 'subir', id_solicitud: sol.id_solicitud } });
  };

  return (
    <div className="sol-root">
      <div className="sol-bg-blob sol-bg-blob--1" />
      <div className="sol-bg-blob sol-bg-blob--2" />

      <div className="sol-container">

        {/* Header */}
        <header className="sol-header">
          <div className="sol-header-wrap">
            <div className="sol-header-icon">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="sol-title">Solicitudes</h1>
              <p className="sol-subtitle">Gestiona tu participación en el mercadito</p>
            </div>
          </div>
        </header>

        {/* Action cards */}
        <section className="sol-actions" aria-label="Acciones de solicitud">
          <button className="sol-action-card" onClick={handleSolicitarEspacio}>
            <div className="sol-action-card-left">
              <div className="sol-action-icon">
                <Map size={20} color="#7b1430" />
              </div>
              <div className="sol-action-text">
                <span className="sol-action-title">Solicitud de espacio</span>
                <span className="sol-action-desc">Elige tu lugar en el croquis del mercadito</span>
              </div>
            </div>
            <ChevronRight size={18} className="sol-action-arrow" />
          </button>
        </section>

        {/* Solicitudes list */}
        {loading ? (
          <section aria-label="Solicitudes activas">
            <h2 className="sol-section-label">Cargando solicitudes…</h2>
            <hr className="sol-divider" />
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Por favor espera, obteniendo información…
            </div>
          </section>

        ) : solicitudes.length > 0 ? (
          <section aria-label="Solicitudes activas">
            <h2 className="sol-section-label">Mis solicitudes</h2>
            <hr className="sol-divider" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {solicitudes.map(sol => (
                <div key={sol.id_solicitud} className="sol-request-card">

                  {/* Header row */}
                  <div className="sol-request-header">
                    <span className="sol-request-title">
                      Espacio {sol.espacios?.numero_espacio ?? sol.id_solicitud}
                    </span>
                    <span className="sol-badge" style={ESTADO_STYLE[sol.estado]}>
                      {ESTADO_LABEL[sol.estado] ?? sol.estado}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="sol-request-list">
                    <div className="sol-request-row">
                      <span className="sol-request-label">Marca</span>
                      <span className="sol-request-value">{sol.marcas?.nombre_marca}</span>
                    </div>
                    <div className="sol-request-row">
                      <span className="sol-request-label">Fecha solicitud</span>
                      <span className="sol-request-value">
                        {new Date(sol.fecha_solicitud).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="sol-request-row">
                      <span className="sol-request-label">Costo</span>
                      <span className="sol-request-value sol-request-value--price">
                        ${(sol.espacios?.precio ?? 350).toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                    {sol.comentario_admin && (
                      <div className="sol-request-row">
                        <span className="sol-request-label">Comentario</span>
                        <span className="sol-request-value" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                          {sol.comentario_admin}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="sol-payment-btn" onClick={() => setStatusModal(sol)}>
                      <FileText size={16} /> Ver estado
                    </button>

                    {/* Only show "Realizar pago" for accepted solicitudes */}
                    {sol.estado === 'aceptada' && (
                      <button
                        className="sol-payment-btn"
                        style={{ background: 'linear-gradient(135deg, rgba(123,20,48,0.08), rgba(200,116,138,0.08))', borderColor: 'rgba(123,20,48,0.3)', color: '#7b1430' }}
                        onClick={() => handleIrAPagar(sol)}
                      >
                        <CreditCard size={16} /> Realizar pago
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </section>

        ) : (
          <section aria-label="Solicitudes activas">
            <h2 className="sol-section-label">Sin solicitudes activas</h2>
            <hr className="sol-divider" />
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px dashed #d1d5db' }}>
              No tienes ninguna solicitud en curso. ¡Usa el mapa interactivo para solicitar un espacio!
            </div>
          </section>
        )}

      </div>

      {/* Status modal */}
      {statusModal && (
        <div className="sol-modal-overlay" onClick={() => setStatusModal(null)}>
          <div className="sol-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sol-modal-close" onClick={() => setStatusModal(null)}>
              <X size={18} />
            </button>

            <div className="sol-modal-header">
              <h2 className="sol-modal-title">Estado de mi solicitud</h2>
              <p className="sol-modal-subtitle">Espacio {statusModal.espacios?.numero_espacio} · {statusModal.marcas?.nombre_marca}</p>
            </div>

            <div className="sol-status-container">
              <div className="sol-status-header">
                <span className="sol-request-title">Espacio {statusModal.espacios?.numero_espacio}</span>
                <span className="sol-badge" style={ESTADO_STYLE[statusModal.estado]}>
                  {ESTADO_LABEL[statusModal.estado]}
                </span>
              </div>

              <div className="sol-timeline">
                {/* Step 1: sent */}
                <div className="sol-timeline-item completed">
                  <div className="sol-timeline-icon"><Check size={14} strokeWidth={3} /></div>
                  <div className="sol-timeline-content">
                    <span className="sol-timeline-title">Solicitud enviada</span>
                    <span className="sol-timeline-desc">
                      {new Date(statusModal.fecha_solicitud).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Step 2: admin review */}
                <div className={`sol-timeline-item ${
                  statusModal.estado === 'pendiente' ? 'warning'
                  : statusModal.estado === 'rechazada' ? 'warning'
                  : 'completed'
                }`}>
                  <div className="sol-timeline-icon">
                    {statusModal.estado === 'pendiente' ? '2'
                      : statusModal.estado === 'rechazada' ? <X size={14} strokeWidth={3} />
                      : <Check size={14} strokeWidth={3} />}
                  </div>
                  <div className="sol-timeline-content">
                    <span className="sol-timeline-title">Revisión del administrador</span>
                    <span className="sol-timeline-desc">
                      {statusModal.estado === 'pendiente' ? 'En proceso…'
                        : statusModal.estado === 'rechazada' ? 'Solicitud rechazada'
                        : 'Aprobada'}
                    </span>
                  </div>
                </div>

                {/* Step 3: payment */}
                <div className={`sol-timeline-item ${statusModal.estado === 'aceptada' ? 'warning' : 'pending'}`}>
                  <div className="sol-timeline-icon">3</div>
                  <div className="sol-timeline-content">
                    <span className="sol-timeline-title">Pago y comprobante</span>
                    <span className="sol-timeline-desc">
                      {statusModal.estado === 'aceptada' ? 'Pendiente de pago' : 'Esperando aprobación'}
                    </span>
                  </div>
                </div>

                {/* Step 4: confirmed */}
                <div className="sol-timeline-item pending">
                  <div className="sol-timeline-icon">4</div>
                  <div className="sol-timeline-content">
                    <span className="sol-timeline-title">Espacio confirmado</span>
                    <span className="sol-timeline-desc">Pendiente</span>
                  </div>
                </div>
              </div>

              {/* CTA inside modal */}
              {statusModal.estado === 'aceptada' && (
                <button
                  className="sol-buy-btn"
                  onClick={() => { setStatusModal(null); handleIrAPagar(statusModal); }}
                >
                  <CreditCard size={16} /> Ir a realizar pago
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Solicitudes;
