import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, MapPin, Calendar, Banknote, Store, Star } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import api from '../../services/axios';
import './RequestModal.css';

interface RequestModalProps { isAdmin: boolean; }

const RequestModal: React.FC<RequestModalProps> = ({ isAdmin }) => {
    const selectedSpace = useMapStore((s) => s.selectedSpace);
    const selectSpace   = useMapStore((s) => s.selectSpace);
    const updateSpace   = useMapStore((s) => s.updateSpace);
    const navigate      = useNavigate();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Brand fetching state
    const [brands, setBrands] = useState<any[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [loadingBrands, setLoadingBrands] = useState(false);

    // Reset state when space changes
    useEffect(() => {
        if (selectedSpace) {
            setStep(1);
            setSubmitted(false);
            setSelectedBrandId(null);
            setError('');
            setLoading(false);
        }
    }, [selectedSpace]);

    // Admins never request spaces — they manage them
    if (isAdmin) return null;
    if (!selectedSpace || selectedSpace.status !== 'available') return null;

    const isPremium = selectedSpace.tipo === 'premium';
    const precio    = selectedSpace.precio ?? 350;

    // ── Step handlers ─────────────────────────────────────────────────────────
    const handleFetchBrands = async () => {
        setStep(2);
        setLoadingBrands(true);
        try {
            const { data } = await api.get('/marcas/mias');
            setBrands(data || []);
        } catch {
            setBrands([]);
        } finally {
            setLoadingBrands(false);
        }
    };

    const handleAdvanceToConfirm = () => {
        if (!selectedBrandId) return;
        setError('');
        setStep(3);
    };

    // Step 3: POST /solicitudes
    const handleConfirm = async () => {
        if (!selectedBrandId) return;

        // Guard: dbId must exist (populated when map syncs with the backend)
        if (!selectedSpace.dbId) {
            setError('No se pudo identificar el espacio en la base de datos. Intenta recargar la página.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.post('/solicitudes', {
                id_marca:   selectedBrandId,
                id_espacio: selectedSpace.dbId,
            });

            // Mark space as pending locally so it turns yellow immediately
            updateSpace(selectedSpace.id, { status: 'pending' });
            setSubmitted(true);

            setTimeout(() => {
                setSubmitted(false);
                selectSpace(null);
                navigate('/solicitudes');
            }, 1400);
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'No se pudo enviar la solicitud';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => selectSpace(null);

    return (
        <div className="rpm-overlay" onClick={handleClose}>
            <div className="rpm-modal" onClick={(e) => e.stopPropagation()}>
                <button className="rpm-close" onClick={handleClose}>
                    <X size={18} />
                </button>

                {submitted ? (
                    <div className="rpm-success">
                        <div className="rpm-success-icon">
                            <Check size={32} strokeWidth={3} />
                        </div>
                        <h2 className="rpm-title">¡Solicitud enviada!</h2>
                        <p className="rpm-subtitle">Redirigiendo a tus solicitudes…</p>
                    </div>
                ) : (
                    <div className="rpm-content">

                        {/* ── STEP 1: Space preview ─────────────────────── */}
                        {step === 1 && (
                            <>
                                <div className="rpm-header">
                                    <div className="rpm-icon-wrap">
                                        <MapPin size={24} />
                                    </div>
                                    <h2 className="rpm-title">Detalle del Espacio</h2>
                                    <p className="rpm-subtitle">Revisa la información antes de continuar.</p>
                                </div>

                                <div className="rpm-space-details">
                                    <div className="rpm-space-header">
                                        <span className="rpm-space-name">{selectedSpace.label ?? selectedSpace.id}</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {isPremium && (
                                                <span className="rpm-badge rpm-badge--premium">
                                                    <Star size={10} fill="currentColor" /> Premium
                                                </span>
                                            )}
                                            <span className="rpm-badge rpm-badge--available">Disponible</span>
                                        </div>
                                    </div>

                                    <div className="rpm-space-row">
                                        <span className="rpm-space-label"><MapPin size={14} /> Dimensiones</span>
                                        <span className="rpm-space-value">
                                            {selectedSpace.width
                                                ? `${(selectedSpace.width/10).toFixed(1)}m x ${(selectedSpace.height/10).toFixed(1)}m`
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="rpm-space-row">
                                        <span className="rpm-space-label"><Calendar size={14} /> Fecha del evento</span>
                                        <span className="rpm-space-value">TBD</span>
                                    </div>
                                    <div className="rpm-space-row">
                                        <span className="rpm-space-label"><Banknote size={14} /> Costo</span>
                                        <span className="rpm-space-value rpm-space-value--cost">
                                            ${precio.toLocaleString('es-MX')} MXN
                                        </span>
                                    </div>
                                </div>

                                <div className="rpm-actions">
                                    <button className="rpm-btn rpm-btn--primary" onClick={handleFetchBrands}>
                                        Continuar
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── STEP 2: Select brand ──────────────────────── */}
                        {step === 2 && (
                            <>
                                <div className="rpm-header">
                                    <div className="rpm-icon-wrap">
                                        <Store size={24} />
                                    </div>
                                    <h2 className="rpm-title">Selección de Marca</h2>
                                    <p className="rpm-subtitle">¿Con qué marca participarás en este espacio?</p>
                                </div>

                                {loadingBrands ? (
                                    <div className="rpm-loader">
                                        <div className="rpm-spinner" />
                                    </div>
                                ) : (
                                    <div className="rpm-brands-list">
                                        {brands.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px' }}>
                                                No tienes marcas registradas.
                                            </div>
                                        ) : (
                                            brands.map(brand => {
                                                const isSelected = selectedBrandId === brand.id_marca;
                                                return (
                                                    <div
                                                        key={brand.id_marca}
                                                        className={`rpm-brand-item ${isSelected ? 'rpm-brand-item--selected' : ''}`}
                                                        onClick={() => setSelectedBrandId(brand.id_marca)}
                                                    >
                                                        <div className="rpm-brand-avatar" style={{ background: '#7b1430' }}>
                                                            {brand.nombre_marca.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="rpm-brand-info">
                                                            <span className="rpm-brand-name">{brand.nombre_marca}</span>
                                                            {brand.descripcion && <span className="rpm-brand-desc">{brand.descripcion}</span>}
                                                        </div>
                                                        <div className="rpm-brand-radio">
                                                            <div className="rpm-brand-radio-inner" />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                <div className="rpm-actions">
                                    <button className="rpm-btn rpm-btn--secondary" onClick={() => setStep(1)}>
                                        Atrás
                                    </button>
                                    <button
                                        className="rpm-btn rpm-btn--primary"
                                        disabled={!selectedBrandId || loadingBrands}
                                        onClick={handleAdvanceToConfirm}
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── STEP 3: Confirm & submit ──────────────────── */}
                        {step === 3 && (
                            <>
                                <div className="rpm-header">
                                    <div className="rpm-icon-wrap">
                                        <Check size={24} />
                                    </div>
                                    <h2 className="rpm-title">Confirmar solicitud</h2>
                                    <p className="rpm-subtitle">Revisa el resumen y confirma tu solicitud.</p>
                                </div>

                                {/* Summary card */}
                                <div className="rpm-bank-card">
                                    <div className="rpm-bank-header">
                                        <span>Resumen</span>
                                    </div>
                                    <div className="rpm-bank-row">
                                        <div className="rpm-bank-info">
                                            <span className="rpm-bank-label">Espacio</span>
                                            <span className="rpm-bank-value">{selectedSpace.label ?? selectedSpace.id}</span>
                                        </div>
                                    </div>
                                    <div className="rpm-bank-row">
                                        <div className="rpm-bank-info">
                                            <span className="rpm-bank-label">Tipo</span>
                                            <span className="rpm-bank-value" style={{ textTransform: 'capitalize' }}>{selectedSpace.tipo}</span>
                                        </div>
                                    </div>
                                    <div className="rpm-bank-row">
                                        <div className="rpm-bank-info">
                                            <span className="rpm-bank-label">Marca</span>
                                            <span className="rpm-bank-value">
                                                {brands.find(b => b.id_marca === selectedBrandId)?.nombre_marca ?? '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="rpm-bank-amount">
                                        <span>Costo a liquidar:</span>
                                        <strong>${precio.toLocaleString('es-MX')} MXN</strong>
                                    </div>
                                </div>

                                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12, lineHeight: 1.5 }}>
                                    Una vez aprobada tu solicitud, recibirás instrucciones para realizar el pago en la sección <strong>Pagos</strong>.
                                </p>

                                {error && (
                                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
                                        {error}
                                    </div>
                                )}

                                <div className="rpm-actions">
                                    <button className="rpm-btn rpm-btn--secondary" onClick={() => setStep(2)} disabled={loading}>
                                        Atrás
                                    </button>
                                    <button
                                        className="rpm-btn rpm-btn--primary"
                                        onClick={handleConfirm}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <><div className="rpm-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Enviando…</>
                                        ) : (
                                            'Confirmar solicitud'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestModal;
