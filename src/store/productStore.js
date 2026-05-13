import { create } from 'zustand'
import { getProducts, getProduct } from '../api/products.api'
import { getPacks, getPack } from '../api/packs.api'
import { supabase } from '../lib/supabase'

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useProductStore = create((set, get) => ({
    products: [],
    selectedProduct: null,
    packs: [],
    selectedPack: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    filters: { category: '', search: '', sort: 'newest' },
    
    // Home Data Cache
    homeData: null,
    homeDataLastFetched: null,
    
    fetchHomeData: async () => {
        const { homeDataLastFetched, homeData } = get();
        const now = Date.now();
        
        // Return cached data if within 5 minutes
        if (homeData && homeDataLastFetched && (now - homeDataLastFetched < CACHE_DURATION)) {
            return;
        }

        set({ loading: true, error: null });
        try {
            const optimizedSelect = `
                id, name_fr, name_ar, price, original_price, on_sale, category, stock_count, 
                images:product_images(image_url, is_primary)
            `;

            const [
                sacsRes, caftansRes, accessoiresRes, 
                heroSettingsRes, caftansCountRes, sacsCountRes, accCountRes
            ] = await Promise.all([
                getProducts({ category: 'sacs', limit: 8, select: optimizedSelect }),
                getProducts({ category: 'caftans', limit: 8, select: optimizedSelect }),
                getProducts({ category: 'accessoires', limit: 8, select: optimizedSelect }),
                supabase.from('site_settings').select('value').eq('key', 'hero_content').maybeSingle(),
                supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', 'caftans'),
                supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', 'sacs'),
                supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', 'accessoires')
            ]);

            set({
                homeData: {
                    sacsProducts: sacsRes.data.products || [],
                    caftansProducts: caftansRes.data.products || [],
                    accessoiresProducts: accessoiresRes.data.products || [],
                    heroSettings: heroSettingsRes.data?.value || null,
                    categoryCounts: {
                        caftans: caftansCountRes.count || 0,
                        sacs: sacsCountRes.count || 0,
                        accessoires: accCountRes.count || 0
                    }
                },
                homeDataLastFetched: now,
                loading: false
            });
        } catch (err) {
            set({ error: err.message || 'Failed to fetch home data', loading: false });
        }
    },

    fetchProducts: async (params = {}) => {
        set({ loading: true, error: null })
        try {
            const currentFilters = get().filters
            const res = await getProducts({ ...currentFilters, ...params })
            set({
                products: res.data.products,
                total: res.data.total,
                page: res.data.page,
                loading: false
            })
        } catch (err) {
            set({ error: err.message || 'Failed to fetch products', loading: false })
        }
    },

    fetchProduct: async (id) => {
        set({ loading: true, error: null })
        try {
            const res = await getProduct(id)
            set({ selectedProduct: res.data, loading: false })
        } catch (err) {
            set({ error: err.message || 'Failed to fetch product', loading: false })
        }
    },

    fetchPacks: async () => {
        set({ loading: true, error: null })
        try {
            const res = await getPacks()
            set({ packs: res.data, loading: false })
        } catch (err) {
            set({ error: err.message || 'Failed to fetch packs', loading: false })
        }
    },

    fetchPack: async (id) => {
        set({ loading: true, error: null })
        try {
            const res = await getPack(id)
            set({ selectedPack: res.data, loading: false })
        } catch (err) {
            set({ error: err.message || 'Failed to fetch pack', loading: false })
        }
    },

    setFilter: (key, value) => {
        set(state => ({ filters: { ...state.filters, [key]: value } }))
        get().fetchProducts({ page: 1 })
    }
}))

export default useProductStore
