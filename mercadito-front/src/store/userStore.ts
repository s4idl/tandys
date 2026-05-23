import { create } from 'zustand';
import type { UserType } from '../features/ui/Navbar';

interface UserStore {
  userType: UserType;
  isAuthenticated: boolean;
  token: string | null;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  setUserType: (t: UserType) => void;
  login: (token: string, type?: UserType) => void;
  logout: () => void;
}

const initialToken = localStorage.getItem('token');

export const useUserStore = create<UserStore>((set) => ({
  userType: initialToken ? 'brand' : 'user', // Defaults: Si hay token asumimos brand/vendedor por ahora, sino user (visitante)
  isAuthenticated: !!initialToken,
  token: initialToken,
  showAuthModal: false,
  
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setUserType: (t) => {
    set({ userType: t });
  },
  
  login: (token, type = 'brand') => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true, userType: type, showAuthModal: false });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, isAuthenticated: false, userType: 'user' });
  },
}));
