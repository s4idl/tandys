import { create } from 'zustand';
import type { UserType } from '../features/ui/Navbar';

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

function getRoleFromToken(token: string | null): UserType {
  if (!token) return 'user';
  const payload = parseJwt(token);
  if (!payload || !payload.rol) return 'user';
  if (payload.rol === 'admin') return 'admin';
  if (payload.rol === 'vendedor') return 'brand';
  return 'user';
}

interface UserStore {
  userType: UserType;
  isAuthenticated: boolean;
  token: string | null;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  setUserType: (t: UserType) => void;
  login: (token: string) => void;
  logout: () => void;
}

const initialToken = localStorage.getItem('token');

export const useUserStore = create<UserStore>((set) => ({
  userType: getRoleFromToken(initialToken),
  isAuthenticated: !!initialToken,
  token: initialToken,
  showAuthModal: false,
  
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setUserType: (t) => set({ userType: t, isAuthenticated: !!localStorage.getItem('token') }),
  
  login: (token) => {
    localStorage.setItem('token', token);
    const type = getRoleFromToken(token);
    set({ token, isAuthenticated: true, userType: type, showAuthModal: false });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false, userType: 'user' });
  },
}));
