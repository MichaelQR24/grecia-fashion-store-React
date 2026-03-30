import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { isAdmin } from '@/lib/permissions';
import type { UserProfile, UserRole } from '@/types';

export type { UserProfile, UserRole };

interface AuthState {
    user: UserProfile | null;
    userRole: UserRole;
    isInitialized: boolean;
    setUser: (user: UserProfile | null) => void;
    setUserRole: (role: UserRole) => void;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    userRole: null,
    isInitialized: false,

    setUser: (user) => set({ user }),
    setUserRole: (userRole) => set({ userRole }),

    initialize: () => {
        // Evita inicializar múltiples veces si ya se hizo
        if (get().isInitialized) return;

        const supabase = createClient();

        // Obtener estado inicial al cargar
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                set({
                    user: { email: session.user.email, id: session.user.id, ...session.user.user_metadata },
                    userRole: isAdmin(session.user) ? 'admin' : 'user',
                    isInitialized: true
                });
            } else {
                set({ user: null, userRole: null, isInitialized: true });
            }
        });

        // Escuchar cambios futuros de estado (Login, Logout)
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                set({
                    user: { email: session.user.email, id: session.user.id, ...session.user.user_metadata },
                    userRole: isAdmin(session.user) ? 'admin' : 'user'
                });
            } else {
                set({ user: null, userRole: null });
            }
        });
    }
}));
