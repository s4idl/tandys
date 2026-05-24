import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { Instagram, Facebook, MapPin, X, Store } from 'lucide-react';
import './BrandPopover.css';

// ── TikTok icon ────────────────────────────────────────────────────────────────
const TikTokIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
  </svg>
);

const BrandPopover: React.FC = () => {
  const selectedSpace = useMapStore((s) => s.selectedSpace);
  const selectSpace = useMapStore((s) => s.selectSpace);
  const popoverPos = useMapStore((s) => s.popoverPos);

  if (!selectedSpace || selectedSpace.status !== 'occupied') return null;

  const marca = selectedSpace.marca_ocupante;
  if (!marca) return null;

  return (
    <div className="brand-popover-overlay" onClick={() => selectSpace(null)}>
      {/* Container is absolutely positioned over the pointer, shifted up so the tail points at the click */}
      <div 
        className="brand-popover-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: popoverPos ? 'absolute' : 'relative',
          left: popoverPos ? `${popoverPos.x}px` : undefined,
          top: popoverPos ? `${popoverPos.y}px` : undefined,
          transform: popoverPos ? 'translate(-50%, calc(-100% - 15px))' : undefined,
          margin: popoverPos ? 0 : 'auto',
        }}
      >
        {/* Tail pointing down */}
        {popoverPos && <div className="brand-popover-tail" />}
        
        <button className="brand-popover-close" onClick={() => selectSpace(null)}>
          <X size={18} />
        </button>

        <div className="brand-popover-header">
          <div className="brand-popover-avatar">
            {marca.logo_url ? (
              <img src={marca.logo_url} alt={marca.nombre_marca} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 800, color: '#db2777' }}>
                {marca.nombre_marca.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="brand-popover-title">{marca.nombre_marca}</h2>
          <span className="brand-popover-badge">
            <MapPin size={12} /> Local {selectedSpace.label}
          </span>
        </div>

        {marca.descripcion && (
          <p className="brand-popover-desc">{marca.descripcion}</p>
        )}

        {(marca.instagram || marca.facebook || marca.tiktok) && (
          <div className="brand-popover-socials">
            {marca.instagram && (
              <a href={`https://instagram.com/${marca.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="brand-social-btn brand-social-btn--ig">
                <Instagram size={14} /> {marca.instagram}
              </a>
            )}
            {marca.facebook && (
              <a href={`https://facebook.com/${marca.facebook}`} target="_blank" rel="noreferrer" className="brand-social-btn brand-social-btn--fb">
                <Facebook size={14} /> Facebook
              </a>
            )}
            {marca.tiktok && (
              <a href={`https://tiktok.com/@${marca.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" className="brand-social-btn brand-social-btn--tiktok">
                <TikTokIcon /> {marca.tiktok}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandPopover;
