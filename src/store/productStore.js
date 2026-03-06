import { create } from 'zustand'
import { getProducts, getProduct } from '../api/products.api'
import { getPacks, getPack } from '../api/packs.api'

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
