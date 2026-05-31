import { create } from 'zustand';
import { getProducts, getProduct } from '../api/products.api';
import { getPacks, getPack } from '../api/packs.api';
import { api } from '../api/client';

const CACHE_DURATION = 5 * 60 * 1000;

const useProductStore = create((set, get) => ({
  products: [],
  selectedProduct: null,
  packs: [],
  selectedPack: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  filters: { category: '', search: '', sort: 'created_at_desc' },

  homeData: null,
  homeDataLastFetched: null,

  fetchHomeData: async () => {
    const { homeDataLastFetched, homeData } = get();
    const now = Date.now();
    if (homeData && homeDataLastFetched && now - homeDataLastFetched < CACHE_DURATION) return;

    set({ loading: true, error: null });
    try {
      const [sacsRes, caftansRes, accRes, jellabasRes, settingsRes] = await Promise.all([
        getProducts({ category: 'sacs', limit: 8 }),
        getProducts({ category: 'caftans', limit: 8 }),
        getProducts({ category: 'accessoires', limit: 8 }),
        getProducts({ category: 'jellabas', limit: 8 }),
        api.get('/settings').catch(() => ({ data: { data: {} } })),
      ]);

      const settings = settingsRes.data?.data ?? {};

      set({
        homeData: {
          sacsProducts: sacsRes.data ?? [],
          caftansProducts: caftansRes.data ?? [],
          accessoiresProducts: accRes.data ?? [],
          jellabasProducts: jellabasRes.data ?? [],
          heroSettings: settings.hero_content,
          categoryCounts: {
            caftans: caftansRes.pagination?.total ?? 0,
            sacs: sacsRes.pagination?.total ?? 0,
            accessoires: accRes.pagination?.total ?? 0,
            jellabas: jellabasRes.pagination?.total ?? 0,
          },
        },
        homeDataLastFetched: now,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch home data', loading: false });
    }
  },

  fetchProducts: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = get().filters;
      const res = await getProducts({ ...currentFilters, ...params });
      set({
        products: res.data ?? [],
        total: res.pagination?.total ?? 0,
        page: res.pagination?.page ?? 1,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch products', loading: false });
    }
  },

  fetchProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      const product = await getProduct(id);
      set({ selectedProduct: product, loading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch product', loading: false });
    }
  },

  fetchPacks: async () => {
    set({ loading: true, error: null });
    try {
      const packs = await getPacks();
      set({ packs, loading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch packs', loading: false });
    }
  },

  fetchPack: async (id) => {
    set({ loading: true, error: null });
    try {
      const pack = await getPack(id);
      set({ selectedPack: pack, loading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch pack', loading: false });
    }
  },

  setFilter: (key, value) => {
    set((state) => ({ filters: { ...state.filters, [key]: value } }));
    get().fetchProducts({ page: 1 });
  },
}));

export default useProductStore;
