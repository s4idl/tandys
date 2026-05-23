import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Upload,
  ChevronRight,
  X,
  Check,
  FileText,
  Banknote,
  Copy,
  Paperclip,
  RefreshCw,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import api from '../../services/axios';
import './Pagos.css';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Solicitud {
  id_solicitud: number;
  estado: string;
  espacios: { numero_espacio: string };
  marcas: { nombre_marca: string };
}

interface Pago {
  id_pago: number;
  id_solicitud: number;
  monto: number;
  metodo_pago: string;
  referencia: string | null;
  estado: 'pendiente' | 'verificado' | 'rechazado';
  fecha_pago: string;
  solicitudes: {
    espacios: { numero_espacio: string };
    marcas: { nombre_marca: string };
  };
  comprobantes?: { archivo_url: string } | null;
}

type View = 'menu' | 'costos' | 'subir' | 'estado';

// ── Utilities ─────────────────────────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  verificado: 'Verificado',
  rechazado: 'Rechazado',
};

const statusClass: Record<string, string> = {
  pendiente: 'pag-badge--pendiente',
  verificado: 'pag-badge--verificado',
  rechazado: 'pag-badge--rechazado',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Toast helper ──────────────────────────────────────────────────────────────
interface ToastState {
  msg: string;
  type: 'success' | 'error' | 'info';
}

// ── Main Component ────────────────────────────────────────────────────────────
const Pagos: React.FC = () => {
  const location = useLocation();
  const navState = (location.state ?? {}) as { view?: string; id_solicitud?: number };

  const [view, setView] = useState<View>(() =>
    navState.view === 'subir' ? 'subir' : 'menu'
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: ToastState['type'] = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const goBack = () => setView('menu');

  return (
    <div className="pag-root">
      <div className="pag-bg-blob pag-bg-blob--1" />
      <div className="pag-bg-blob pag-bg-blob--2" />

      <div className="pag-container">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="pag-header">
          <div className="pag-header-wrap">
            {view !== 'menu' && (
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginRight: 4, display: 'flex', alignItems: 'center' }}
                onClick={goBack}
                aria-label="Volver"
              >
                <ChevronLeft size={24} color="#7b1430" />
              </button>
            )}
            <div className="pag-header-icon">
              <CreditCard size={28} />
            </div>
            <div>
              <h1 className="pag-title">Pagos</h1>
              <p className="pag-subtitle">Gestión financiera de tu participación</p>
            </div>
          </div>
        </header>

        {/* ── Views ───────────────────────────────────────────────────────── */}
        {view === 'menu'   && <MenuView setView={setView} />}
        {view === 'costos' && <CostosView />}
        {view === 'subir'  && <SubirView showToast={showToast} preselectedSolId={navState.id_solicitud} />}
        {view === 'estado' && <EstadoView />}

      </div>

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`pag-toast pag-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

// ── Menu View ─────────────────────────────────────────────────────────────────
const MenuView: React.FC<{ setView: (v: View) => void }> = ({ setView }) => (
  <section className="pag-actions" aria-label="Opciones de pagos">
    <button className="pag-action-card" id="pag-btn-costos" onClick={() => setView('costos')}>
      <div className="pag-action-card-left">
        <div className="pag-action-icon">💰</div>
        <div className="pag-action-text">
          <span className="pag-action-title">Consultar costo y métodos de pago</span>
          <span className="pag-action-desc">Tarifas y formas de pago aceptadas</span>
        </div>
      </div>
      <ChevronRight size={18} className="pag-action-arrow" />
    </button>

    <button className="pag-action-card" id="pag-btn-subir" onClick={() => setView('subir')}>
      <div className="pag-action-card-left">
        <div className="pag-action-icon">📤</div>
        <div className="pag-action-text">
          <span className="pag-action-title">Subir comprobante de pago</span>
          <span className="pag-action-desc">Liquida tu espacio y envía tu recibo</span>
        </div>
      </div>
      <ChevronRight size={18} className="pag-action-arrow" />
    </button>

    <button className="pag-action-card" id="pag-btn-estado" onClick={() => setView('estado')}>
      <div className="pag-action-card-left">
        <div className="pag-action-icon">📊</div>
        <div className="pag-action-text">
          <span className="pag-action-title">Consultar estado del pago</span>
          <span className="pag-action-desc">Verifica si tu comprobante fue aprobado</span>
        </div>
      </div>
      <ChevronRight size={18} className="pag-action-arrow" />
    </button>
  </section>
);

// ── Costos View ───────────────────────────────────────────────────────────────
const CostosView: React.FC = () => {
  const [copied, setCopied] = useState('');

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="pag-panel" style={{ animationDelay: '0s' }}>
      <h2 className="pag-panel-title">Costo y métodos de pago</h2>
      <p className="pag-panel-subtitle">Consulta las tarifas vigentes para el mercadito</p>

      {/* Tariff grid */}
      <div className="pag-tariff-grid">
        <div className="pag-tariff-card">
          <div className="pag-tariff-card-label">Espacio estándar</div>
          <div className="pag-tariff-card-value">$350</div>
          <div className="pag-tariff-card-sub">MXN / evento</div>
        </div>
        <div className="pag-tariff-card">
          <div className="pag-tariff-card-label">Espacio premium</div>
          <div className="pag-tariff-card-value">$600</div>
          <div className="pag-tariff-card-sub">MXN / evento</div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ marginTop: 20 }}>
        <div className="pag-info-row">
          <span className="pag-info-label">Incluye</span>
          <span className="pag-info-value">Mesa + silla + electricidad</span>
        </div>
        <div className="pag-info-row">
          <span className="pag-info-label">Límite de pago</span>
          <span className="pag-info-value">72 hrs tras aprobación</span>
        </div>
        <div className="pag-info-row">
          <span className="pag-info-label">Moneda</span>
          <span className="pag-info-value">Pesos mexicanos (MXN)</span>
        </div>
      </div>

      {/* Payment methods */}
      <div className="pag-methods">
        <p className="pag-methods-title">Métodos de pago aceptados</p>

        <div className="pag-method-row">
          <div className="pag-method-icon">
            <Banknote size={18} color="#7b1430" />
          </div>
          <div className="pag-method-text">
            <span className="pag-method-name">Transferencia bancaria</span>
            <span className="pag-method-detail">CLABE: 012345678901234567</span>
          </div>
          <button
            className="pag-copy-btn"
            onClick={() => copy('012345678901234567', 'clabe')}
          >
            {copied === 'clabe' ? <Check size={12} /> : <Copy size={12} />}
            {' '}{copied === 'clabe' ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>

        <div className="pag-method-row">
          <div className="pag-method-icon">
            <FileText size={18} color="#7b1430" />
          </div>
          <div className="pag-method-text">
            <span className="pag-method-name">Depósito en cuenta</span>
            <span className="pag-method-detail">Banco: BBVA · Cuenta: 1234 5678</span>
          </div>
          <button
            className="pag-copy-btn"
            onClick={() => copy('1234 5678', 'cuenta')}
          >
            {copied === 'cuenta' ? <Check size={12} /> : <Copy size={12} />}
            {' '}{copied === 'cuenta' ? '¡Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div style={{
        marginTop: 20,
        padding: '14px 16px',
        background: 'rgba(251,191,36,0.06)',
        border: '1px solid rgba(251,191,36,0.25)',
        borderRadius: 12,
        fontSize: 13,
        color: '#92400e',
        lineHeight: 1.5,
      }}>
        ⚠️ Una vez realizado el pago, sube tu comprobante en la sección <strong>Subir comprobante</strong> para que el equipo de Tandys pueda verificarlo.
      </div>
    </div>
  );
};

// ── Subir View ────────────────────────────────────────────────────────────────
const SubirView: React.FC<{
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  preselectedSolId?: number;
}> = ({ showToast, preselectedSolId }) => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [selectedSolId, setSelectedSolId] = useState<string>(
    preselectedSolId ? String(preselectedSolId) : ''
  );
  const [pagoId, setPagoId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDrag, setIsDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSols, setLoadingSols] = useState(true);

  // Fetch approved solicitudes (aceptadas) that might need payment
  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        setLoadingSols(true);
        const { data } = await api.get<Solicitud[]>('/solicitudes/mias');
        // Only show accepted ones
        const aceptadas = data.filter((s) => s.estado === 'aceptada');
        setSolicitudes(aceptadas);
      } catch (err) {
        console.error('Error fetching solicitudes', err);
      } finally {
        setLoadingSols(false);
      }
    };
    fetchSolicitudes();
  }, []);

  // When solicitud is selected, try to find its pago
  useEffect(() => {
    if (!selectedSolId) { setPagoId(null); return; }
    const fetchPago = async () => {
      try {
        // GET /pagos → filter by solicitud. We look for pago matching the selected solicitud.
        // Backend doesn't have a direct /pagos/solicitud/:id route, so we GET /pagos/:id where we
        // need to know the pago id. Instead we create a new pago if one doesn't exist yet.
        // For now just reset pagoId and let the submit handler create+upload.
        setPagoId(null);
      } catch {
        setPagoId(null);
      }
    };
    fetchPago();
  }, [selectedSolId]);

  const handleFile = (f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      showToast('Solo se aceptan imágenes (JPG, PNG, WebP) o PDF', 'error');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showToast('El archivo no puede superar 10 MB', 'error');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!selectedSolId || !file) return;
    setLoading(true);
    try {
      const solId = Number(selectedSolId);
      let currentPagoId = pagoId;

      // 1. Create pago record if not yet created
      if (!currentPagoId) {
        const { data: pagoData } = await api.post('/pagos', {
          id_solicitud: solId,
          monto: Number(solicitudes.find(s => s.id_solicitud === solId)?.espacios?.precio ?? 350),
          metodo_pago: 'transferencia',
        });
        currentPagoId = pagoData.id_pago;
        setPagoId(currentPagoId);
      }

      // 2. Upload receipt file
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/pagos/${currentPagoId}/comprobante`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('¡Comprobante enviado con éxito! El equipo lo revisará pronto.', 'success');
      setFile(null);
      setSelectedSolId('');
      setPagoId(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al subir el comprobante';
      showToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pag-panel">
      <h2 className="pag-panel-title">Subir comprobante de pago</h2>
      <p className="pag-panel-subtitle">Selecciona tu solicitud y adjunta el recibo</p>

      {/* Solicitud selector */}
      <label className="pag-select-label" htmlFor="pag-select-sol">
        Solicitud aprobada
      </label>
      {loadingSols ? (
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Cargando solicitudes…</div>
      ) : (
        <select
          id="pag-select-sol"
          className="pag-select"
          value={selectedSolId}
          onChange={(e) => setSelectedSolId(e.target.value)}
        >
          <option value="">Elige tu solicitud aprobada</option>
          {solicitudes.length === 0 && (
            <option disabled>No tienes solicitudes aprobadas aún</option>
          )}
          {solicitudes.map((s) => (
            <option key={s.id_solicitud} value={String(s.id_solicitud)}>
              Espacio {s.espacios?.numero_espacio ?? s.id_solicitud} — {s.marcas?.nombre_marca}
            </option>
          ))}
        </select>
      )}

      {/* Drop zone */}
      <div
        className={`pag-upload-zone${isDrag ? ' pag-upload-zone--drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="pag-file-input"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <div className="pag-upload-icon">
          <Upload size={22} />
        </div>
        <p className="pag-upload-title">
          {file ? 'Cambia el archivo' : 'Arrastra tu comprobante aquí'}
        </p>
        <p className="pag-upload-desc">JPG, PNG, WebP o PDF · máx. 10 MB</p>
      </div>

      {/* File preview */}
      {file && (
        <div className="pag-upload-preview">
          <div className="pag-upload-preview-icon">
            <Paperclip size={16} />
          </div>
          <span className="pag-upload-preview-name">{file.name}</span>
          <span className="pag-upload-preview-size">{(file.size / 1024).toFixed(0)} KB</span>
          <button className="pag-upload-remove" onClick={() => setFile(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Submit */}
      <button
        id="pag-btn-submit"
        className="pag-btn-primary"
        disabled={!selectedSolId || !file || loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <><div className="pag-spinner" /> Enviando…</>
        ) : (
          <><Upload size={16} /> Enviar comprobante</>
        )}
      </button>
    </div>
  );
};

// ── Estado View ───────────────────────────────────────────────────────────────
// GET /pagos is admin-only. The backend team will add GET /pagos/mias.
// Until then, we show a friendly message if the brand hits a 403.
const EstadoView: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminOnly, setAdminOnly] = useState(false);
  const [error, setError] = useState('');

  const fetchPagos = async () => {
    try {
      setLoading(true);
      setAdminOnly(false);
      setError('');
      const { data } = await api.get<Pago[]>('/pagos');
      setPagos(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) {
        setAdminOnly(true); // endpoint not yet available for brand
      } else {
        const msg = err?.response?.data?.message ?? 'Error al cargar pagos';
        setError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPagos(); }, []);

  const getTimelineSteps = (pago: Pago) => {
    const hasComprobante = !!pago.comprobantes?.archivo_url;
    const estado = pago.estado;

    return [
      {
        label: 'Registro de pago',
        desc: `Registrado el ${formatDate(pago.fecha_pago)}`,
        status: 'done',
      },
      {
        label: 'Comprobante subido',
        desc: hasComprobante ? 'Comprobante recibido' : 'Aún no has subido comprobante',
        status: hasComprobante ? 'done' : 'pending',
      },
      {
        label: 'Verificación',
        desc:
          estado === 'verificado' ? 'Aprobado por el equipo Tandys'
          : estado === 'rechazado' ? 'Comprobante rechazado'
          : 'En revisión…',
        status:
          estado === 'verificado' ? 'done'
          : estado === 'rechazado' ? 'rejected'
          : hasComprobante ? 'active'
          : 'pending',
      },
      {
        label: 'Espacio confirmado',
        desc: estado === 'verificado' ? '¡Tu lugar está asegurado!' : 'Pendiente de verificación',
        status: estado === 'verificado' ? 'done' : 'pending',
      },
    ];
  };

  return (
    <div className="pag-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h2 className="pag-panel-title" style={{ marginBottom: 0 }}>Estado de tus pagos</h2>
        <button
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7b1430', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}
          onClick={fetchPagos}
          aria-label="Actualizar"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>
      <p className="pag-panel-subtitle">Seguimiento de tus comprobantes enviados</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div className="pag-spinner" style={{ margin: '0 auto 12px', borderColor: 'rgba(123,20,48,0.2)', borderTopColor: '#7b1430' }} />
          Cargando pagos…
        </div>
      ) : error ? (
        <div className="pag-empty">
          <div className="pag-empty-icon">⚠️</div>
          <p style={{ fontWeight: 600 }}>{error}</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Asegúrate de tener solicitudes aprobadas con pago registrado.</p>
        </div>
      ) : adminOnly ? (
        <div className="pag-empty">
          <div className="pag-empty-icon"><Clock size={32} color="#9ca3af" /></div>
          <p style={{ fontWeight: 600 }}>Consulta disponible próximamente</p>
          <p style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
            El equipo de Tandys está habilitando el historial de pagos para marcas.
            Puedes verificar tu pago contactando al administrador.
          </p>
        </div>
      ) : pagos.length === 0 ? (
        <div className="pag-empty">
          <div className="pag-empty-icon">💳</div>
          <p style={{ fontWeight: 600 }}>Sin pagos registrados</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Cuando tengas una solicitud aprobada, registra tu pago y súbelo aquí.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pagos.map((pago) => {
            const steps = getTimelineSteps(pago);
            return (
              <div key={pago.id_pago} className="pag-status-card">
                <div className="pag-status-header">
                  <div>
                    <div className="pag-status-name">
                      Espacio {pago.solicitudes?.espacios?.numero_espacio ?? '—'}
                    </div>
                    <div className="pag-status-meta">
                      {pago.solicitudes?.marcas?.nombre_marca} · ${pago.monto} MXN · {pago.metodo_pago}
                    </div>
                  </div>
                  <span className={`pag-badge ${statusClass[pago.estado] ?? 'pag-badge--sin-pago'}`}>
                    {statusLabel[pago.estado] ?? pago.estado}
                  </span>
                </div>

                {/* Timeline */}
                <div className="pag-timeline">
                  {steps.map((step, i) => (
                    <div key={i} className="pag-timeline-item">
                      <div
                        className={`pag-timeline-dot${
                          step.status === 'done' ? ' pag-timeline-dot--done'
                          : step.status === 'active' ? ' pag-timeline-dot--active'
                          : step.status === 'rejected' ? ' pag-timeline-dot--rejected'
                          : ''
                        }`}
                      >
                        {step.status === 'done' ? <Check size={13} strokeWidth={3} />
                          : step.status === 'rejected' ? <X size={13} strokeWidth={3} />
                          : i + 1}
                      </div>
                      <div className="pag-timeline-content">
                        <span className="pag-timeline-step-title">{step.label}</span>
                        <span className="pag-timeline-step-desc">{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comprobante link */}
                {pago.comprobantes?.archivo_url && (
                  <a
                    href={pago.comprobantes.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pag-comprobante-preview"
                  >
                    <Paperclip size={14} color="#7b1430" />
                    <span>Ver comprobante adjunto</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pagos;
