import React, { useEffect, useState } from 'react';
import { Store, CheckCircle, Clock, DollarSign, Activity, PieChart, Users, Zap, LayoutGrid } from 'lucide-react';
import api from '../../services/axios';
import './DashboardAdmin.css';
import type { Space, Marca, Pago, Solicitud } from '../../types';

interface DashboardData {
  espacios: Space[];
  marcas: Marca[];
  solicitudes: Solicitud[];
  pagos: Pago[];
}

// ── Componente Principal ──────────────────────────────────────────────────
const DashboardAdmin: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Usamos Promise.all para cargar todo de forma paralela
        const [espRes, marRes, solRes, pagRes] = await Promise.all([
          api.get<Space[]>('/espacios'),
          api.get<Marca[]>('/marcas'),
          api.get<Solicitud[]>('/solicitudes'),
          api.get<Pago[]>('/pagos').catch(() => ({ data: [] as Pago[] })) // Fallback si no hay endpoint de pagos
        ]);

        setData({
          espacios: espRes.data,
          marcas: marRes.data,
          solicitudes: solRes.data,
          pagos: pagRes.data,
        });
      } catch (err: unknown) {
        console.error('Error cargando la información del dashboard', err);
        setError('No se pudo cargar la información del servidor. Por favor, revisa tu conexión o intenta recargar la página.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#7b1430', background: '#fef2f2', padding: '24px', borderRadius: '16px', border: '1px solid #fee2e2' }}>
          <Zap size={32} style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Error de Conexión</h2>
          <p style={{ fontSize: 14, margin: 0, color: '#991b1b' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="dash-root">
        <div className="dash-content">
          <div className="dash-header">
            <div className="dash-skeleton dash-skel-title" />
            <div className="dash-skeleton dash-skel-sub" />
          </div>
          <div className="dash-metrics-grid">
            {[1, 2, 3, 4].map(i => <div key={i} className="dash-skeleton dash-skel-card" />)}
          </div>
          <div className="dash-split">
            <div className="dash-skeleton dash-skel-panel" />
            <div className="dash-skeleton dash-skel-panel" />
          </div>
        </div>
      </div>
    );
  }

  // ── Cálculos de Métricas ─────────────────────────────────────────────────
  const totalSpaces = data.espacios.length || 27; // Fallback a 27 si no hay
  const occupiedSpaces = data.espacios.filter(e => e.status === 'occupied' || e.status === 'pending').length;
  const occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

  const pendingRequests = data.solicitudes.filter(s => s.estado === 'pendiente');
  const acceptedRequests = data.solicitudes.filter(s => s.estado === 'aceptada');
  const rejectedRequests = data.solicitudes.filter(s => s.estado === 'rechazada');
  const totalRequests = data.solicitudes.length;

  const approvalRate = totalRequests > 0 ? Math.round((acceptedRequests.length / totalRequests) * 100) : 0;

  const pendingPayments = data.pagos.filter(p => p.estado === 'pendiente');

  let revPremium = 0;
  let revEstandar = 0;

  data.pagos.filter(p => p.estado === 'verificado').forEach(pago => {
    const sol = data.solicitudes.find(s => s.id_solicitud === pago.id_solicitud);
    const amount = Number(pago.monto) || 0;
    if (sol) {
      const esp = data.espacios.find(e => e.dbId === sol.id_espacio || e.id === String(sol.id_espacio) || e.id === `L${sol.id_espacio}`);
      if (esp?.tipo === 'premium') {
        revPremium += amount;
      } else {
        revEstandar += amount;
      }
    } else {
      revEstandar += amount; // Fallback
    }
  });

  const totalRevenue = revPremium + revEstandar;

  // Ordenar solicitudes por ID o fecha para simular "recientes" (asumiendo IDs más altos son más nuevos)
  const recentRequests = [...data.solicitudes].sort((a, b) => b.id_solicitud - a.id_solicitud).slice(0, 5);

  // Cálculos para la gráfica de pastel (conic-gradient)
  const accPct = totalRequests > 0 ? (acceptedRequests.length / totalRequests) * 100 : 0;
  const penPct = totalRequests > 0 ? (pendingRequests.length / totalRequests) * 100 : 0;
  const pieGradient = `#10b981 0% ${accPct}%, #f59e0b ${accPct}% ${accPct + penPct}%, #ef4444 ${accPct + penPct}% 100%`;

  return (
    <div className="dash-root">
      <div className="dash-blob dash-blob--1" />
      <div className="dash-blob dash-blob--2" />

      <div className="dash-content">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="dash-header">
          <div className="dash-header-icon-wrap">
            <Activity size={26} strokeWidth={2.5} />
          </div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            Monitorea el estado actual de los espacios, marcas registradas y flujo de caja en tiempo real.
          </p>
        </header>

        {/* ── Metrics Grid ────────────────────────────────────────────────── */}
        <div className="dash-metrics-grid">
          {/* Ocupación */}
          <div
            className="dash-metric-card"
            style={{ '--metric-color': 'rgba(59, 130, 246, 0.2)' } as React.CSSProperties}
          >
            <div className="dash-metric-card-glow" />
            <div className="dash-metric-header">
              <div className="dash-metric-icon" style={{ '--metric-bg': '#eff6ff', '--metric-icon-color': '#3b82f6' } as React.CSSProperties}>
                <LayoutGrid size={18} />
              </div>
              Ocupación
            </div>
            <div className="dash-metric-body">
              <h3 className="dash-metric-value">{occupancyRate}%</h3>
              <span className="dash-metric-sub">{occupiedSpaces} de {totalSpaces} locales</span>
            </div>
          </div>

          {/* Tasa de Aprobación */}
          <div className="dash-metric-card" style={{ '--metric-color': 'rgba(16, 185, 129, 0.2)' } as React.CSSProperties}>
            <div className="dash-metric-card-glow" />
            <div className="dash-metric-header">
              <div className="dash-metric-icon" style={{ '--metric-bg': '#ecfdf5', '--metric-icon-color': '#10b981' } as React.CSSProperties}>
                <CheckCircle size={18} />
              </div>
              Aprobación
            </div>
            <div className="dash-metric-body">
              <h3 className="dash-metric-value">{approvalRate}%</h3>
              <span className="dash-metric-sub">Solicitudes aceptadas</span>
            </div>
          </div>

          {/* Pagos por Revisar */}
          <div
            className="dash-metric-card"
            style={{ '--metric-color': 'rgba(245, 158, 11, 0.2)' } as React.CSSProperties}
          >
            <div className="dash-metric-card-glow" />
            <div className="dash-metric-header">
              <div className="dash-metric-icon" style={{ '--metric-bg': pendingPayments.length > 0 ? '#fef2f2' : '#fffbeb', '--metric-icon-color': pendingPayments.length > 0 ? '#ef4444' : '#f59e0b' } as React.CSSProperties}>
                <DollarSign size={18} />
              </div>
              <span style={{ color: pendingPayments.length > 0 ? '#ef4444' : 'inherit' }}>Pagos por Revisar</span>
            </div>
            <div className="dash-metric-body">
              <h3 className="dash-metric-value" style={{ color: pendingPayments.length > 0 ? '#ef4444' : 'inherit' }}>{pendingPayments.length}</h3>
              <span className="dash-metric-sub">Requieren verificación</span>
            </div>
          </div>

          {/* Ingresos (Pagos verificados) */}
          <div className="dash-metric-card" style={{ '--metric-color': 'rgba(123, 20, 48, 0.2)' } as React.CSSProperties}>
            <div className="dash-metric-card-glow" />
            <div className="dash-metric-header">
              <div className="dash-metric-icon" style={{ '--metric-bg': '#fdf2f8', '--metric-icon-color': '#be185d' } as React.CSSProperties}>
                <DollarSign size={18} />
              </div>
              Ingresos Totales
            </div>
            <div className="dash-metric-body">
              <h3 className="dash-metric-value">${totalRevenue.toLocaleString('es-MX')}</h3>
              <span className="dash-metric-sub">MXN (Verificados)</span>
            </div>
          </div>
        </div>

        {/* ── Charts Row (Pie & Bars) ─────────────────────────────────────────────── */}
        <div className="dash-split" style={{ marginBottom: '24px' }}>

          {/* Panel Izquierdo: Estado de Solicitudes (Pie Chart) */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3 className="dash-panel-title">
                <PieChart size={18} color="#7b1430" />
                Estado de Solicitudes
              </h3>
            </div>

            {totalRequests === 0 ? (
              <div className="dash-empty">Aún no hay solicitudes registradas en el sistema.</div>
            ) : (
              <div className="dash-pie-container">
                {/* Gráfica de pastel/dona CSS */}
                <div
                  className="dash-pie"
                  style={{ '--pie-grad': pieGradient } as React.CSSProperties}
                />

                {/* Leyenda */}
                <div className="dash-pie-legend">
                  {/* Aceptadas */}
                  <div className="dash-pie-item">
                    <div className="dash-pie-label">
                      <span className="dash-pie-dot" style={{ '--pie-color': '#10b981' } as React.CSSProperties} />
                      Aceptadas
                    </div>
                    <span className="dash-pie-value">{acceptedRequests.length} ({Math.round(accPct)}%)</span>
                  </div>

                  {/* Pendientes */}
                  <div className="dash-pie-item">
                    <div className="dash-pie-label">
                      <span className="dash-pie-dot" style={{ '--pie-color': '#f59e0b' } as React.CSSProperties} />
                      Pendientes
                    </div>
                    <span className="dash-pie-value">{pendingRequests.length} ({Math.round(penPct)}%)</span>
                  </div>

                  {/* Rechazadas */}
                  <div className="dash-pie-item">
                    <div className="dash-pie-label">
                      <span className="dash-pie-dot" style={{ '--pie-color': '#ef4444' } as React.CSSProperties} />
                      Rechazadas
                    </div>
                    <span className="dash-pie-value">{rejectedRequests.length} ({Math.round(100 - accPct - penPct)}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho: Desglose de Ventas */}
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h3 className="dash-panel-title">
                <Store size={18} color="#7b1430" />
                Desglose de Ingresos
              </h3>
            </div>

            {totalRevenue === 0 ? (
              <div className="dash-empty">Aún no hay ingresos verificados.</div>
            ) : (
              <div className="dash-bars" style={{ marginTop: 10 }}>
                {/* Premium */}
                <div className="dash-bar-item">
                  <div className="dash-bar-labels">
                    <span className="dash-bar-name">
                      <span className="dash-bar-dot" style={{ '--bar-color': '#7c3aed' } as React.CSSProperties} />
                      Premium
                    </span>
                    <span className="dash-bar-value">
                      ${revPremium.toLocaleString('es-MX')} ({Math.round((revPremium / totalRevenue) * 100)}%)
                    </span>
                  </div>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${(revPremium / totalRevenue) * 100}%`, '--bar-color': '#7c3aed' } as React.CSSProperties} />
                  </div>
                </div>

                {/* Estándar */}
                <div className="dash-bar-item" style={{ marginTop: 16 }}>
                  <div className="dash-bar-labels">
                    <span className="dash-bar-name">
                      <span className="dash-bar-dot" style={{ '--bar-color': '#0ea5e9' } as React.CSSProperties} />
                      Estándar
                    </span>
                    <span className="dash-bar-value">
                      ${revEstandar.toLocaleString('es-MX')} ({Math.round((revEstandar / totalRevenue) * 100)}%)
                    </span>
                  </div>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${(revEstandar / totalRevenue) * 100}%`, '--bar-color': '#0ea5e9' } as React.CSSProperties} />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Panel Abajo (Actividad Reciente Full Width) ─────────────────────── */}
        <div className="dash-panel">
          <div className="dash-panel-header" style={{ marginBottom: '16px' }}>
            <h3 className="dash-panel-title">
              <Users size={18} color="#7b1430" />
              Actividad Reciente
            </h3>
          </div>

          <div className="dash-feed dash-feed--grid">
            {recentRequests.length === 0 ? (
              <div className="dash-empty">No hay actividad reciente.</div>
            ) : (
              recentRequests.map(req => {
                let icon = <Clock size={16} />;
                let bg = '#fffbeb';
                let color = '#f59e0b';
                let statusText = 'Solicitud en revisión';

                if (req.estado === 'aceptada') {
                  icon = <CheckCircle size={16} />;
                  bg = '#ecfdf5';
                  color = '#10b981';
                  statusText = 'Solicitud aprobada';
                } else if (req.estado === 'rechazada') {
                  icon = <Zap size={16} />;
                  bg = '#fef2f2';
                  color = '#ef4444';
                  statusText = 'Solicitud rechazada';
                }

                // Extraemos una fecha simulada o real de la solicitud
                const fecha = new Date(req.fecha_solicitud).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

                return (
                  <div
                    key={req.id_solicitud}
                    className="dash-feed-item"
                    style={{ '--feed-color': color } as React.CSSProperties}
                  >
                    <div className="dash-feed-icon" style={{ '--feed-bg': bg, '--feed-color': color } as React.CSSProperties}>
                      {icon}
                    </div>
                    <div className="dash-feed-content">
                      <h4 className="dash-feed-title">Espacio #{req.espacios?.numero_espacio ?? req.id_espacio} — {req.marcas?.nombre_marca ?? `Marca #${req.id_marca}`}</h4>
                      <p className="dash-feed-desc">{statusText}</p>
                    </div>
                    <div className="dash-feed-time" style={{ textAlign: 'right' }}>
                      <span>Sol #{req.id_solicitud}</span>
                      <span style={{ display: 'block', fontSize: '10px', marginTop: '4px' }}>{fecha}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
