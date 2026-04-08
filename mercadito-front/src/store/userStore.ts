import { create } from 'zustand';
import type { UserType } from '../features/ui/Navbar';

interface UserStore {
  userType: UserType;
  setUserType: (t: UserType) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userType: 'brand', // dev default — replace with 'user' when auth is real
  setUserType: (t) => set({ userType: t }),
}));
