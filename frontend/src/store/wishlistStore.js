import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
    persist(
        (set, get) => ({
            items: [],

            toggle: (product) => {
                const { items } = get();
                const exists = items.find((p) => p.id === product.id);
                set({
                    items: exists
                        ? items.filter((p) => p.id !== product.id)
                        : [...items, product],
                });
            },

            isWishlisted: (id) => get().items.some((p) => p.id === id),

            remove: (id) => {
                set({ items: get().items.filter((p) => p.id !== id) });
            },

            clearWishlist: () => set({ items: [] }),
        }),
        { name: 'mdc-wishlist' }
    )
);
