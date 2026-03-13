import React, { useState } from 'react';
import api from '../../services/axios';

interface RegisterBrandModalProps {
    onClose: () => void;
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

const RegisterBrandModal: React.FC<RegisterBrandModalProps> = ({ onClose }) => {
    const [form, setForm] = useState<FormData>({
        nombre_marca: '',
        descripcion: '',
        logo_url: '',
        instagram: '',
        facebook: '',
        tiktok: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    const set = (field: keyof FormData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm((f) => ({ ...f, [field]: e.target.value }));
            // clear error on change
            if (errors[field as keyof FormErrors]) {
                setErrors((err) => ({ ...err, [field]: undefined }));
            }
        };

    const validate = (): boolean => {
        const errs: FormErrors = {};

        // Backend rule: nombre_marca is @IsNotEmpty() @MaxLength(150)
        if (!form.nombre_marca.trim()) {
            errs.nombre_marca = 'El nombre de la marca es obligatorio.';
        } else if (form.nombre_marca.length > 150) {
            errs.nombre_marca = 'Máximo 150 caracteres.';
        }

        // Backend rule: logo_url is @IsOptional() @MaxLength(255)
        if (form.logo_url && form.logo_url.length > 255) {
            errs.logo_url = 'La URL del logo no puede superar 255 caracteres.';
        }

        // Backend rule: instagram @IsOptional() @MaxLength(150)
        if (form.instagram && form.instagram.length > 150) {
            errs.instagram = 'Máximo 150 caracteres.';
        }

        // Backend rule: facebook @IsOptional() @MaxLength(150)
        if (form.facebook && form.facebook.length > 150) {
            errs.facebook = 'Máximo 150 caracteres.';
        }

        // Backend rule: tiktok @IsOptional() @MaxLength(150)
        if (form.tiktok && form.tiktok.length > 150) {
            errs.tiktok = 'Máximo 150 caracteres.';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        setApiError(null);

        try {
            await api.post('/marcas', {
                nombre_marca: form.nombre_marca,
                descripcion: form.descripcion || undefined,
                logo_url: form.logo_url || undefined,
                instagram: form.instagram || undefined,
                facebook: form.facebook || undefined,
                tiktok: form.tiktok || undefined,
            });
            setSubmitted(true);
            setTimeout(onClose, 2000);
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 401) {
                setApiError('No autorizado. Inicia sesión para continuar.');
            } else if (status === 403) {
                setApiError('No tienes permiso para registrar una marca.');
            } else {
                setApiError(err?.response?.data?.message || 'Ocurrió un error. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Reusable field renderer
    const field = (
        label: string,
        key: keyof FormData,
        placeholder: string,
        maxLen: number,
        type: 'input' | 'textarea' = 'input'
    ) => {
        const hasError = !!errors[key as keyof FormErrors];
        const inputStyle: React.CSSProperties = hasError
            ? { borderColor: '#dc2626', boxShadow: '0 0 0 2px rgba(220,38,38,0.15)' }
            : {};

        return (
            <label className="rb-col">
                {label}
                {type === 'textarea' ? (
                    <textarea
                        className="rb-textarea"
                        placeholder={placeholder}
                        rows={3}
                        value={form[key]}
                        onChange={set(key)}
                        maxLength={maxLen}
                        style={inputStyle}
                    />
                ) : (
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={set(key)}
                        maxLength={maxLen}
                        style={inputStyle}
                    />
                )}
                {hasError && (
                    <span className="field-error" style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        ⚠️ {errors[key as keyof FormErrors]}
                    </span>
                )}
                {/* Live character counter for fields with limits */}
                <span style={{ fontSize: 11, color: form[key].length > maxLen * 0.9 ? '#f59e0b' : '#9ca3af', textAlign: 'right' }}>
                    {form[key].length}/{maxLen}
                </span>
            </label>
        );
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-card rb-card">
                <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

                {submitted ? (
                    <div className="modal-success">
                        <span>🎉</span>
                        <p>¡Marca registrada!</p>
                        <span style={{ fontSize: 14, color: '#6b7280' }}>Cerrando…</span>
                    </div>
                ) : (
                    <>
                        <div className="modal-header">
                            <span className="modal-icon">🏷️</span>
                            <div>
                                <h2 className="modal-title">Registrar Marca</h2>
                                <p className="modal-space-id">Completa los datos de tu marca</p>
                            </div>
                        </div>

                        <form className="modal-form rb-form" onSubmit={handleSubmit} noValidate>
                            <div className="rb-grid">
                                {field('Nombre de la Marca *', 'nombre_marca', 'Ej. Postres Catia', 150)}
                                {field('Instagram', 'instagram', '@tu_marca', 150)}
                                {field('Descripción', 'descripcion', 'Cuéntanos brevemente sobre tu marca…', 500, 'textarea')}
                                {field('TikTok', 'tiktok', '@tu_tiktok', 150)}
                                {field('Facebook', 'facebook', 'Nombre de página o URL', 150)}
                                {field('URL del Logo', 'logo_url', 'https://mi-sitio.com/logo.png', 255)}
                            </div>

                            {apiError && (
                                <p style={{ color: '#dc2626', fontSize: 13, marginTop: 8, padding: '8px 12px', background: 'rgba(220,38,38,0.08)', borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)' }}>
                                    ⚠️ {apiError}
                                </p>
                            )}

                            <button type="submit" className="modal-submit rb-submit" disabled={isLoading}>
                                {isLoading ? 'Guardando…' : 'Finalizar Registro'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default RegisterBrandModal;
