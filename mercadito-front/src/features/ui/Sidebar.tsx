import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '../../store/mapStore';

interface SidebarProps {
    isAdmin: boolean;
    onToggleAdmin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin, onToggleAdmin }) => {
    const navigate = useNavigate();
    const selectedSpace = useMapStore((s) => s.selectedSpace);
    const selectSpace = useMapStore((s) => s.selectSpace);

    const handleNuevaSolicitud = () => {
        if (!selectedSpace) {
            alert('Primero selecciona un espacio disponible en el mapa.');
            return;
        }
        if (selectedSpace.status !== 'available') {
            alert(`El espacio ${selectedSpace.id} no está disponible.`);
            return;
        }
        // The modal picks up selectedSpace from the store — just navigate or open
    };

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <span className="sidebar-logo">🏪</span>
                <div>
                    <h1 className="sidebar-title">Mercadito</h1>
                    <p className="sidebar-subtitle">Platform</p>
                </div>
            </div>

            {/* Selected space info */}
            {selectedSpace && (
                <div className={`sidebar-selected-info status-${selectedSpace.status}`}>
                    <span className="selected-label">Seleccionado</span>
                    <strong>{selectedSpace.label ?? selectedSpace.id}</strong>
                    <span className="selected-status">
                        {selectedSpace.status === 'available' && '● Disponible'}
                        {selectedSpace.status === 'occupied' && '● Ocupado'}
                        {selectedSpace.status === 'pending' && '● Pendiente'}
                    </span>
                    <button className="btn-clear" onClick={() => selectSpace(null)}>✕</button>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                <button
                    className={`sidebar-btn primary ${!selectedSpace || selectedSpace.status !== 'available' ? 'disabled' : ''}`}
                    onClick={handleNuevaSolicitud}
                    disabled={!selectedSpace || selectedSpace.status !== 'available'}
                >
                    <span className="btn-icon">📋</span>
                    Nueva Solicitud
                </button>

                <button
                    className="sidebar-btn"
                    onClick={() => navigate('/pagos')}
                >
                    <span className="btn-icon">💳</span>
                    Mis Pagos
                </button>

                <button
                    className="sidebar-btn"
                    onClick={() => navigate('/solicitudes')}
                >
                    <span className="btn-icon">📂</span>
                    Solicitudes
                </button>

                <button
                    className="sidebar-btn"
                    onClick={() => alert('Soporte: soporte@mercadito.com')}
                >
                    <span className="btn-icon">💬</span>
                    Soporte
                </button>
            </nav>

            {/* Admin toggle */}
            <div className="sidebar-footer">
                <button
                    className={`sidebar-btn admin-toggle ${isAdmin ? 'admin-active' : ''}`}
                    onClick={onToggleAdmin}
                >
                    <span className="btn-icon">{isAdmin ? '🔓' : '🔒'}</span>
                    {isAdmin ? 'Modo Admin ON' : 'Modo Admin OFF'}
                </button>
            </div>

            {/* Legend */}
            <div className="sidebar-legend">
                <span className="legend-item"><span className="dot available" />Disponible</span>
                <span className="legend-item"><span className="dot occupied" />Ocupado</span>
                <span className="legend-item"><span className="dot pending" />Pendiente</span>
            </div>
        </aside>
    );
};

export default Sidebar;
