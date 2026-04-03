import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';

interface RequestModalProps { isAdmin: boolean; }

const RequestModal: React.FC<RequestModalProps> = ({ isAdmin }) => {
    const selectedSpace = useMapStore((s) => s.selectedSpace);
    const selectSpace   = useMapStore((s) => s.selectSpace);
    const updateSpace   = useMapStore((s) => s.updateSpace);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Admins never request spaces — they manage them
    if (isAdmin) return null;
    if (!selectedSpace || selectedSpace.status !== 'available') return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;

        // Mark the space as 'pending' immediately so the map colour updates
        updateSpace(selectedSpace.id, { status: 'pending' });

        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setName('');
            setPhone('');
            selectSpace(null);
        }, 2000);
    };

    return (
        <div className="modal-overlay" onClick={() => selectSpace(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => selectSpace(null)}>✕</button>

                <div className="modal-header">
                    <span className="modal-icon">📋</span>
                    <div>
                        <h2 className="modal-title">Nueva Solicitud</h2>
                        <p className="modal-space-id">Espacio: <strong>{selectedSpace.label ?? selectedSpace.id}</strong></p>
                    </div>
                </div>

                {submitted ? (
                    <div className="modal-success">
                        <span>✅</span>
                        <p>¡Solicitud enviada con éxito!</p>
                    </div>
                ) : (
                    <form className="modal-form" onSubmit={handleSubmit}>
                        <label>
                            Nombre completo
                            <input
                                type="text"
                                placeholder="Ej. María García"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </label>

                        <label>
                            Teléfono de contacto
                            <input
                                type="tel"
                                placeholder="Ej. +52 55 1234 5678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </label>

                        <button type="submit" className="modal-submit">
                            Enviar Solicitud
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RequestModal;
