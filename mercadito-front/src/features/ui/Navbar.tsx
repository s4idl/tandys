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
} from 'lucide-react';
import tandyslogo from '../../assets/tandyslogo.png';

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
        { id: 'profile',label: 'Perfil',        icon: <User size={24} />,   path: '/perfil' },
      ];
  }
};

// ── Role labels for dev switcher ──────────────────────────────────────────────
const ROLE_CYCLE: UserType[] = ['user', 'brand', 'admin'];
const ROLE_LABELS: Record<UserType, string> = {
  user:  '👤 User',
  brand: '🏪 Brand',
  admin: '🔑 Admin',
};
const ROLE_COLORS: Record<UserType, string> = {
  user:  'rgba(99,102,241,0.85)',
  brand: 'rgba(236,72,153,0.85)',
  admin: 'rgba(30,58,95,0.9)',
};

// ── Component ─────────────────────────────────────────────────────────────────
const Navbar: React.FC<NavbarProps> = ({ userType: externalType, onUserTypeChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Internal dev state — overridden by external prop if provided
  const [internalType, setInternalType] = useState<UserType>('user');
  const [showRolePicker, setShowRolePicker] = useState(false);

  const activeType = externalType ?? internalType;

  const handleRoleChange = (t: UserType) => {
    setInternalType(t);
    onUserTypeChange?.(t);
    setShowRolePicker(false);
  };

  const items = getNavItems(activeType);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {/* ── Logo — fixed top-left ─────────────────────────────────────────── */}
      <div className="navbar-logo">
        <img src={tandyslogo} alt="Tandys" className="navbar-logo-img" />
      </div>

      {/* ── Floating Tab Bar ─────────────────────────────────────────────── */}
      <nav className="navbar-tabbar" aria-label="Navegación principal">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`navbar-tab${active ? ' navbar-tab--active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              title={item.label}
            >
              <span className="navbar-tab-icon">{item.icon}</span>
              <span className={`navbar-tab-label${active ? ' navbar-tab-label--active' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Dev: Role Switcher ────────────────────────────────────────────── */}
      <div className="dev-role-switcher">
        {/* Popup picker */}
        {showRolePicker && (
          <div className="dev-role-picker">
            {ROLE_CYCLE.map((role) => (
              <button
                key={role}
                className={`dev-role-option${activeType === role ? ' dev-role-option--active' : ''}`}
                style={{ '--role-color': ROLE_COLORS[role] } as React.CSSProperties}
                onClick={() => handleRoleChange(role)}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        )}

        {/* Main dev button */}
        <button
          id="dev-switch-role"
          className="dev-role-btn"
          style={{ background: ROLE_COLORS[activeType] }}
          onClick={() => setShowRolePicker((v) => !v)}
          title="Dev: cambiar rol"
        >
          <ChevronUp
            size={12}
            style={{
              transform: showRolePicker ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              opacity: 0.7,
            }}
          />
          <span>{ROLE_LABELS[activeType]}</span>
        </button>
      </div>
    </>
  );
};

export default Navbar;
