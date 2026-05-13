import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getAdminOrders, updateOrderStatus as apiUpdateStatus } from '../api/orders.api';

export const useAdminStore = create(
    persist(
        (set, get) => ({
            admin: null,
            token: localStorage.getItem('admin_token'),
            orders: [],
            totalPages: 1,
            currentPage: 1,
            totalOrders: 0,
            stats: {},

            setAdmin: (admin) => set({ admin }),
            setToken: (token) => {
                localStorage.setItem('admin_token', token);
                set({ token });
            },
            logout: async () => {
                await supabase.auth.signOut();
                localStorage.removeItem('admin_token');
                set({ admin: null, token: null });
            },

            fetchOrders: async (params = {}) => {
                try {
                    const { data } = await getAdminOrders(params);
                    set({ 
                        orders: data.orders || [],
                        totalPages: data.pages || 1,
                        currentPage: params.page || 1,
                        totalOrders: data.total || 0
                    });
                } catch (error) {
                    console.error('fetchOrders error:', error);
                    set({ orders: [], totalPages: 1, totalOrders: 0 });
                }
            },

            updateOrderStatus: async (id, status) => {
                try {
                    await apiUpdateStatus(id, status);
                    const orders = get().orders.map(o =>
                        o.id === id ? { ...o, status } : o
                    );
                    set({ orders });
                } catch (error) {
                    console.error('updateOrderStatus error:', error);
                }
            },

            deleteOrder: async (id) => {
                try {
                    const { deleteOrder: apiDeleteOrder } = await import('../api/orders.api');
                    await apiDeleteOrder(id);
                    const orders = get().orders.filter(o => o.id !== id);
                    set({ orders });
                } catch (error) {
                    console.error('deleteOrder error:', error);
                    throw error;
                }
            },

            statsLastFetched: null,

            fetchStats: async (force = false) => {
                try {
                    const now = Date.now();
                    const { statsLastFetched, stats } = get();
                    
                    if (!force && statsLastFetched && (now - statsLastFetched < 2 * 60 * 1000) && Object.keys(stats).length > 0) {
                        return; // Use cached stats
                    }

                    const today = new Date().toISOString().split('T')[0];
                    const startOfMonth = new Date(
                        new Date().getFullYear(), new Date().getMonth(), 1
                    ).toISOString();

                    const [
                        { count: todayOrders },
                        { count: pendingOrders },
                        { data: revenueData },
                        { count: totalProds }
                    ] = await Promise.all([
                        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
                        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                        supabase.from('orders').select('total_price').gte('created_at', startOfMonth).eq('status', 'delivered'),
                        supabase.from('products').select('id', { count: 'exact', head: true })
                    ]);

                    const revenue = revenueData?.reduce((s, r) => s + (r.total_price || 0), 0) || 0;
                    set({
                        stats: {
                            today_orders: todayOrders || 0,
                            pending_orders: pendingOrders || 0,
                            month_revenue: revenue,
                            products_count: totalProds || 0
                        },
                        statsLastFetched: now
                    });
                } catch (error) {
                    console.error('fetchStats error:', error);
                }
            },
        }),
        { name: 'admin-storage' }
    )
);
