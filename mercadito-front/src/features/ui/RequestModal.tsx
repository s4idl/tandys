import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';

const RequestModal: React.FC = () => {
    const selectedSpace = useMapStore((s) => s.selectedSpace);
    const selectSpace = useMapStore((s) => s.selectSpace);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (!selectedSpace || selectedSpace.status !== 'available') return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;
        // Simulate submission
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
