import React, { useState, useRef } from 'react';
import {
  X,
  Store,
  Instagram,
  Facebook,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Upload,
  Link,
} from 'lucide-react';
import api from '../../services/axios';
import './RegisterBrandWizard.css';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface MarcaData {
  id_marca: number;
  nombre_marca: string;
  descripcion: string | null;
  logo_url: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  fecha_creacion?: string | null;
}

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  marcaToEdit?: MarcaData;
}

interface FormData {
  nombre_marca: string;
  descripcion: string;
  logo_url: string;
  instagram: string;
  facebook: string;
  tiktok: string;
}

interface FormErrors {
  nombre_marca?: string;
  logo_url?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

// ── Step definitions ───────────────────────────────────────────────────────────
const STEPS = ['Identidad', 'Historia', 'Redes', 'Confirmar'] as const;
type Step = 0 | 1 | 2 | 3;

// ── Avatar preview helper ──────────────────────────────────────────────────────
const AvatarPreview: React.FC<{ nombre: string; logoUrl: string }> = ({ nombre, logoUrl }) => {
  const initials = nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo preview"
        className="rbw-avatar-img"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="rbw-avatar-placeholder">
      <span>{initials}</span>
    </div>
  );
};

// ── TikTok icon (not in lucide) ────────────────────────────────────────────────
const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
  </svg>
);

// ── Main component ─────────────────────────────────────────────────────────────
const RegisterBrandWizard: React.FC<Props> = ({ onClose, onSuccess, marcaToEdit }) => {
  const isEdit = !!marcaToEdit;
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormData>({
    nombre_marca: marcaToEdit?.nombre_marca || '',
    descripcion: marcaToEdit?.descripcion || '',
    logo_url: marcaToEdit?.logo_url || '',
    instagram: marcaToEdit?.instagram || '',
    facebook: marcaToEdit?.facebook || '',
    tiktok: marcaToEdit?.tiktok || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Field updater ────────────────────────────────────────────────────────────
  const update = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      if (errors[field as keyof FormErrors]) {
        setErrors((err) => ({ ...err, [field]: undefined }));
      }
      setApiError(null);
    };

  // ── Per-step validation ──────────────────────────────────────────────────────
  const validateStep = (s: Step): boolean => {
    const errs: FormErrors = {};
    if (s === 0) {
      if (!form.nombre_marca.trim()) errs.nombre_marca = 'El nombre es obligatorio.';
      else if (form.nombre_marca.length > 150) errs.nombre_marca = 'Máximo 150 caracteres.';
      if (form.logo_url && form.logo_url.length > 255) errs.logo_url = 'URL demasiado larga (máx 255).';
    }
    if (s === 2) {
      if (form.instagram.length > 150) errs.instagram = 'Máximo 150 caracteres.';
      if (form.facebook.length > 150) errs.facebook = 'Máximo 150 caracteres.';
      if (form.tiktok.length > 150) errs.tiktok = 'Máximo 150 caracteres.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0) as Step);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const payload = {
        nombre_marca: form.nombre_marca,
        descripcion: form.descripcion || undefined,
        logo_url: form.logo_url || undefined,
        instagram: form.instagram || undefined,
        facebook: form.facebook || undefined,
        tiktok: form.tiktok || undefined,
      };

      if (isEdit && marcaToEdit) {
        await api.put(`/marcas/${marcaToEdit.id_marca}`, payload);
      } else {
        await api.post('/marcas', payload);
      }
      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2200);
    } catch (err: unknown) {
      const status = (err as { response?: { status: number; data?: { message: string } } })?.response?.status;
      if (status === 401) setApiError('No autorizado. Inicia sesión para continuar.');
      else if (status === 403) setApiError('No tienes permiso para registrar una marca.');
      else setApiError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Close on overlay click ───────────────────────────────────────────────────
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="rbw-overlay" ref={overlayRef}>
        <div className="rbw-modal rbw-modal--success">
          <div className="rbw-success-ring">
            <Check size={36} strokeWidth={2.5} />
          </div>
          <h2>{isEdit ? '¡Marca actualizada!' : '¡Marca creada!'}</h2>
          <p>Tu marca <strong>{form.nombre_marca}</strong> ha sido {isEdit ? 'actualizada' : 'registrada'} con éxito.</p>
          <div className="rbw-success-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="rbw-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="rbw-modal">

        {/* ── Close button ──────────────────────────────────────────────── */}
        <button className="rbw-close" onClick={onClose} aria-label="Cerrar" id="rbw-close-btn">
          <X size={16} />
        </button>

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div className="rbw-left">
          <div className="rbw-left-top">
            <div className="rbw-brand-icon">
              <Store size={22} />
            </div>
            <h1 className="rbw-left-title">{isEdit ? 'Editar' : 'Registrar'}<br />Marca</h1>
            <p className="rbw-left-sub">{isEdit ? 'Actualiza tu perfil de' : 'Tu negocio en el'}<br />mercadito Tandys</p>
          </div>

          {/* Step indicators */}
          <nav className="rbw-steps" aria-label="Pasos del formulario">
            {STEPS.map((label, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'pending';
              return (
                <div key={label} className={`rbw-step rbw-step--${state}`}>
                  <div className="rbw-step-dot">
                    {state === 'done' ? <Check size={11} strokeWidth={3} /> : <span>{i + 1}</span>}
                  </div>
                  <span className="rbw-step-label">{label}</span>
                  {i < STEPS.length - 1 && <div className="rbw-step-line" />}
                </div>
              );
            })}
          </nav>

          {/* Live avatar preview */}
          <div className="rbw-preview-zone">
            <AvatarPreview nombre={form.nombre_marca} logoUrl={form.logo_url} />
            <p className="rbw-preview-name">{form.nombre_marca || 'Tu marca'}</p>
            {form.descripcion && (
              <p className="rbw-preview-desc">{form.descripcion.slice(0, 60)}{form.descripcion.length > 60 ? '…' : ''}</p>
            )}
          </div>
        </div>

        {/* ── Right panel ───────────────────────────────────────────────── */}
        <div className="rbw-right">
          {/* Progress bar */}
          <div className="rbw-progress-bar">
            <div className="rbw-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Step header */}
          <div className="rbw-step-header">
            <span className="rbw-step-num">Paso {step + 1} de {STEPS.length}</span>
            <h2 className="rbw-step-title">
              {step === 0 && '¿Cómo se llama tu marca?'}
              {step === 1 && 'Cuéntanos sobre tu marca'}
              {step === 2 && 'Tus redes sociales'}
              {step === 3 && 'Confirma tu información'}
            </h2>
            <p className="rbw-step-desc">
              {step === 0 && 'El nombre y logo son lo primero que verán los visitantes.'}
              {step === 1 && 'Una buena descripción atrae más clientes.'}
              {step === 2 && 'Opcional — conecta tus redes para mayor alcance.'}
              {step === 3 && 'Revisa que todo esté correcto antes de registrar.'}
            </p>
          </div>

          {/* ── Step 0: Identidad ──────────────────────────────────────── */}
          {step === 0 && (
            <div className="rbw-fields">
              <div className="rbw-field-group">
                <label className="rbw-label" htmlFor="rbw-nombre">
                  <Store size={14} /> Nombre de la Marca <span className="rbw-required">*</span>
                </label>
                <input
                  id="rbw-nombre"
                  className={`rbw-input${errors.nombre_marca ? ' rbw-input--error' : ''}`}
                  type="text"
                  placeholder="Ej. Postres Catia"
                  value={form.nombre_marca}
                  onChange={update('nombre_marca')}
                  maxLength={150}
                  autoFocus
                />
                {errors.nombre_marca && <span className="rbw-error">{errors.nombre_marca}</span>}
                <span className="rbw-counter">{form.nombre_marca.length}/150</span>
              </div>

              <div className="rbw-field-group">
                <label className="rbw-label" htmlFor="rbw-logo">
                  <Link size={14} /> URL del Logo <span className="rbw-optional">(opcional)</span>
                </label>
                <div className="rbw-logo-input-wrap">
                  <Upload size={15} className="rbw-logo-icon" />
                  <input
                    id="rbw-logo"
                    className={`rbw-input rbw-input--icon${errors.logo_url ? ' rbw-input--error' : ''}`}
                    type="text"
                    placeholder="https://mi-sitio.com/logo.png"
                    value={form.logo_url}
                    onChange={update('logo_url')}
                    maxLength={255}
                  />
                </div>
                {errors.logo_url && <span className="rbw-error">{errors.logo_url}</span>}
                <span className="rbw-hint">Pega una URL de imagen (jpg, png, webp)</span>
              </div>
            </div>
          )}

          {/* ── Step 1: Historia ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="rbw-fields">
              <div className="rbw-field-group rbw-field-group--full">
                <label className="rbw-label" htmlFor="rbw-desc">
                  <Sparkles size={14} /> Descripción <span className="rbw-optional">(opcional)</span>
                </label>
                <textarea
                  id="rbw-desc"
                  className="rbw-textarea"
                  placeholder="Cuéntanos brevemente sobre tu marca, qué vendes y qué te hace especial…"
                  rows={5}
                  value={form.descripcion}
                  onChange={update('descripcion')}
                  maxLength={120}
                  autoFocus
                />
                <div className="rbw-counter-row">
                  <span className="rbw-hint">El límite actual es de 120 caracteres.</span>
                  <span className="rbw-counter">{form.descripcion.length}/120</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Redes ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="rbw-fields">
              <div className="rbw-field-group">
                <label className="rbw-label" htmlFor="rbw-ig">
                  <Instagram size={14} /> Instagram
                </label>
                <div className="rbw-social-input-wrap">
                  <span className="rbw-social-prefix">@</span>
                  <input
                    id="rbw-ig"
                    className={`rbw-input rbw-input--social${errors.instagram ? ' rbw-input--error' : ''}`}
                    type="text"
                    placeholder="tu_marca"
                    value={form.instagram}
                    onChange={update('instagram')}
                    maxLength={150}
                    autoFocus
                  />
                </div>
                {errors.instagram && <span className="rbw-error">{errors.instagram}</span>}
              </div>

              <div className="rbw-field-group">
                <label className="rbw-label" htmlFor="rbw-tiktok">
                  <TikTokIcon /> TikTok
                </label>
                <div className="rbw-social-input-wrap">
                  <span className="rbw-social-prefix">@</span>
                  <input
                    id="rbw-tiktok"
                    className={`rbw-input rbw-input--social${errors.tiktok ? ' rbw-input--error' : ''}`}
                    type="text"
                    placeholder="tu_tiktok"
                    value={form.tiktok}
                    onChange={update('tiktok')}
                    maxLength={150}
                  />
                </div>
                {errors.tiktok && <span className="rbw-error">{errors.tiktok}</span>}
              </div>

              <div className="rbw-field-group">
                <label className="rbw-label" htmlFor="rbw-fb">
                  <Facebook size={14} /> Facebook
                </label>
                <div className="rbw-social-input-wrap">
                  <span className="rbw-social-prefix">@</span>
                  <input
                    id="rbw-fb"
                    className={`rbw-input rbw-input--social${errors.facebook ? ' rbw-input--error' : ''}`}
                    type="text"
                    placeholder="Nombre de página o URL"
                    value={form.facebook}
                    onChange={update('facebook')}
                    maxLength={150}
                  />
                </div>
                {errors.facebook && <span className="rbw-error">{errors.facebook}</span>}
              </div>
            </div>
          )}

          {/* ── Step 3: Confirmar ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="rbw-fields rbw-confirm">
              <div className="rbw-confirm-row">
                <span className="rbw-confirm-label">Nombre</span>
                <span className="rbw-confirm-value">{form.nombre_marca}</span>
              </div>
              {form.descripcion && (
                <div className="rbw-confirm-row rbw-confirm-row--desc">
                  <span className="rbw-confirm-label">Descripción</span>
                  <span className="rbw-confirm-value rbw-confirm-value--desc">{form.descripcion}</span>
                </div>
              )}
              {form.logo_url && (
                <div className="rbw-confirm-row">
                  <span className="rbw-confirm-label">Logo URL</span>
                  <span className="rbw-confirm-value rbw-confirm-value--url">{form.logo_url}</span>
                </div>
              )}
              <div className="rbw-confirm-socials">
                {form.instagram && (
                  <div className="rbw-confirm-social">
                    <Instagram size={13} />
                    <span>@{form.instagram}</span>
                  </div>
                )}
                {form.tiktok && (
                  <div className="rbw-confirm-social">
                    <TikTokIcon />
                    <span>@{form.tiktok}</span>
                  </div>
                )}
                {form.facebook && (
                  <div className="rbw-confirm-social">
                    <Facebook size={13} />
                    <span>{form.facebook}</span>
                  </div>
                )}
                {!form.instagram && !form.tiktok && !form.facebook && (
                  <span className="rbw-confirm-none">Sin redes sociales registradas</span>
                )}
              </div>

              {apiError && (
                <div className="rbw-api-error">
                  ⚠️ {apiError}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation buttons ─────────────────────────────────────── */}
          <div className="rbw-nav">
            {step > 0 ? (
              <button className="rbw-btn-back" onClick={prev} type="button" id="rbw-btn-back">
                <ArrowLeft size={16} />
                Anterior
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button className="rbw-btn-next" onClick={next} type="button" id={`rbw-btn-next-${step}`}>
                Siguiente
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="rbw-btn-submit"
                onClick={handleSubmit}
                disabled={isLoading}
                type="button"
                id="rbw-btn-submit"
              >
                {isLoading ? (
                  <span className="rbw-spinner" />
                ) : (
                  <Check size={16} strokeWidth={2.5} />
                )}
                {isLoading ? (isEdit ? 'Guardando…' : 'Registrando…') : (isEdit ? 'Guardar Cambios' : 'Crear Marca')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterBrandWizard;
