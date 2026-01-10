import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';
  company?: {
    id: string;
    name: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'admin-auth',
    }
  )
);

// Demo admin user
export const DEMO_ADMIN = {
  id: 'admin-001',
  email: 'admin@componi.app',
  name: '관리자',
  role: 'ADMIN' as const,
  company: {
    id: 'company-001',
    name: '컴포니 주식회사',
  },
};
