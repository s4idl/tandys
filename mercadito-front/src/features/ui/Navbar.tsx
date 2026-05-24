import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Map,
  Search,
  User,
  Store,
  FileText,
  CreditCard,
  LayoutDashboard,
  ClipboardList,
  Settings,
  ChevronUp,
  LogIn,
} from 'lucide-react';
import tandyslogo from '../../assets/tandyslogo.png';
import { useUserStore } from '../../store/userStore';
import { useMapStore } from '../../store/mapStore';

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserType = 'user' | 'brand' | 'admin';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface NavbarProps {
  /** Controlled from outside if you want; otherwise use internal dev switcher */
  userType?: UserType;
  onUserTypeChange?: (t: UserType) => void;
}

// ── Nav item definitions per role ─────────────────────────────────────────────
const getNavItems = (userType: UserType): NavItem[] => {
  switch (userType) {
    case 'admin':
      return [
        { id: 'map',        label: 'Mapa',              icon: <Map size={24} />,           path: '/' },
        { id: 'dashboard',  label: 'Dashboard',         icon: <LayoutDashboard size={24}/>, path: '/dashboard' },
        { id: 'solicitudes',label: 'Gestión',           icon: <ClipboardList size={24} />, path: '/solicitudes' },
        { id: 'settings',   label: 'Ajustes',           icon: <Settings size={24} />,      path: '/ajustes' },
      ];
    case 'brand':
      return [
        { id: 'map',        label: 'Mapa',              icon: <Map size={24} />,        path: '/' },
        { id: 'brand',      label: 'Mi Marca',          icon: <Store size={24} />,      path: '/mi-marca' },
        { id: 'solicitudes',label: 'Solicitudes',       icon: <FileText size={24} />,   path: '/solicitudes' },
        { id: 'pagos',      label: 'Pagos',             icon: <CreditCard size={24} />, path: '/pagos' },
        { id: 'profile',    label: 'Perfil',            icon: <User size={24} />,       path: '/perfil' },
      ];
    default: // 'user'
      return [
        { id: 'map',    label: 'Mapa',          icon: <Map size={24} />,    path: '/' },
        { id: 'search', label: 'Buscar marca',  icon: <Search size={24} />, path: '/buscar' },
        { id: 'login',  label: 'Iniciar sesión',icon: <LogIn size={24} />,  path: '#' },
      ];
  }
};

// ── Component ─────────────────────────────────────────────────────────────────
const Navbar: React.FC<NavbarProps> = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const spaces = useMapStore(s => s.spaces);
  const selectSpace = useMapStore(s => s.selectSpace);

  const items = getNavItems(userType || 'user');

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleTabClick = (item: NavItem) => {
    if (item.id === 'login') {
      useUserStore.getState().setShowAuthModal(true);
      return;
    }
    if (item.id === 'search') {
      setShowSearch(!showSearch);
      setQuery('');
      return;
    }
    // Si da click en otro tab, cerramos la barra de búsqueda
    setShowSearch(false);
    navigate(item.path);
  };

  const handleResultClick = (space: any) => {
    selectSpace(space, null);
    setShowSearch(false);
    setQuery('');
  };

  // Filtrar locales ocupados
  const searchResults = query.trim().length > 0 
    ? spaces.filter(s => 
        s.status === 'occupied' && 
        s.marca_ocupante?.nombre_marca?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const isMapPage = location.pathname === '/';

  return (
    <>
      {/* ── Logo — fixed top-left ─────────────────────────────────────────── */}
      {isMapPage && (
        <div className="navbar-logo">
          <img src={tandyslogo} alt="Tandys" className="navbar-logo-img" />
        </div>
      )}

      {/* ── Search Bar Overlay ───────────────────────────────────────────── */}
      {showSearch && (
        <div className="navbar-search-overlay">
          <div className="navbar-search-container">
            <div className="navbar-search-input-wrap">
              <Search size={18} className="navbar-search-icon" />
              <input 
                type="text" 
                className="navbar-search-input" 
                placeholder="Busca el nombre de una marca..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            {query.trim().length > 0 && (
              <div className="navbar-search-results">
                {searchResults.length > 0 ? (
                  searchResults.map(s => (
                    <button 
                      key={s.id} 
                      className="navbar-search-result-item"
                      onClick={() => handleResultClick(s)}
                    >
                      <div className="navbar-search-avatar">
                        {s.marca_ocupante?.logo_url ? (
                          <img src={s.marca_ocupante.logo_url} alt="" />
                        ) : (
                          <span>{s.marca_ocupante?.nombre_marca?.substring(0,2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="navbar-search-info">
                        <strong>{s.marca_ocupante?.nombre_marca}</strong>
                        <span>Local {s.label}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="navbar-search-empty">No se encontraron marcas</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Floating Tab Bar ─────────────────────────────────────────────── */}
      <nav className="navbar-tabbar" aria-label="Navegación principal">
        {items.map((item) => {
          // If search is open, ONLY the search tab is active. Otherwise, rely on the route path.
          const active = showSearch 
            ? item.id === 'search' 
            : isActive(item.path);

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`navbar-tab${active && item.id !== 'login' ? ' navbar-tab--active' : ''}`}
              onClick={() => handleTabClick(item)}
              aria-current={active ? 'page' : undefined}
              title={item.label}
            >
              <span className="navbar-tab-icon">{item.icon}</span>
              <span className={`navbar-tab-label${active && item.id !== 'login' ? ' navbar-tab-label--active' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
