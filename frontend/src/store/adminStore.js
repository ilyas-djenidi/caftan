import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAdminOrders, updateOrderStatus as apiUpdateStatus, deleteOrder as apiDeleteOrder } from '../api/orders.api';
import { getDashboardStats } from '../api/stats.api';

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
      statsLastFetched: null,

      setAdmin: (admin) => set({ admin }),

      setToken: (token) => {
        if (token) {
          localStorage.setItem('admin_token', token);
        } else {
          localStorage.removeItem('admin_token');
        }
        set({ token });
      },

      logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        set({ admin: null, token: null, orders: [], stats: {} });
      },

      fetchOrders: async (params = {}) => {
        try {
          const result = await getAdminOrders(params);
          set({
            orders: result.data ?? [],
            totalPages: result.pagination?.pages ?? 1,
            currentPage: params.page ?? 1,
            totalOrders: result.pagination?.total ?? 0,
          });
        } catch (error) {
          console.error('fetchOrders error:', error);
          set({ orders: [], totalPages: 1, totalOrders: 0 });
        }
      },

      updateOrderStatus: async (id, status) => {
        try {
          await apiUpdateStatus(id, status);
          set((state) => ({
            orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
          }));
        } catch (error) {
          console.error('updateOrderStatus error:', error);
          throw error;
        }
      },

      deleteOrder: async (id) => {
        try {
          await apiDeleteOrder(id);
          set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
        } catch (error) {
          console.error('deleteOrder error:', error);
          throw error;
        }
      },

      fetchStats: async (force = false) => {
        try {
          const now = Date.now();
          const { statsLastFetched, stats } = get();
          if (!force && statsLastFetched && now - statsLastFetched < 2 * 60 * 1000 && Object.keys(stats).length > 0) {
            return;
          }
          const data = await getDashboardStats();
          set({ stats: data, statsLastFetched: now });
        } catch (error) {
          console.error('fetchStats error:', error);
        }
      },
    }),
    { name: 'admin-storage', partialize: (s) => ({ admin: s.admin, token: s.token }) }
  )
);
