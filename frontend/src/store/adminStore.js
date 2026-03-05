import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAdminStore = create(
    persist(
        (set) => ({
            admin: null,
            token: localStorage.getItem('admin_token'),
            setAdmin: (admin) => set({ admin }),
            setToken: (token) => {
                localStorage.setItem('admin_token', token);
                set({ token });
            },
            logout: async () => {
                await supabase.auth.signOut();
                localStorage.removeItem('admin_token');
                set({ admin: null, token: null });
            }
        }),
        {
            name: 'admin-storage'
        }
    )
);
