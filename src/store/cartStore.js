import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            isDrawerOpen: false,

            openDrawer: () => set({ isDrawerOpen: true }),
            closeDrawer: () => set({ isDrawerOpen: false }),

            addItem: (product, size, color, quantity = 1) => {
                const { items } = get();
                const key = `${product.id}-${size}-${color}`;
                const existing = items.find((i) => i.key === key);

                const currentQty = existing ? existing.quantity : 0;
                const newQty = currentQty + quantity;

                // Stock guard
                if (product.stock_count !== undefined && product.stock_count !== null && newQty > product.stock_count) {
                    return false; // Indicate failure to add
                }

                if (existing) {
                    set({
                        items: items.map((i) =>
                            i.key === key ? { ...i, quantity: newQty } : i
                        ),
                    });
                } else {
                    set({
                        items: [
                            ...items,
                            { key, product, size, color, quantity, addedAt: Date.now() },
                        ],
                    });
                }
                return true; // Indicate success
            },

            removeItem: (key) => {
                set({ items: get().items.filter((i) => i.key !== key) });
            },

            updateQuantity: (key, quantity) => {
                if (quantity < 1) {
                    set({ items: get().items.filter((i) => i.key !== key) });
                    return;
                }

                const item = get().items.find(i => i.key === key);
                if (item && item.product.stock_count !== undefined && item.product.stock_count !== null && quantity > item.product.stock_count) {
                    return; // Prevent exceeding stock
                }

                set({
                    items: get().items.map((i) =>
                        i.key === key ? { ...i, quantity } : i
                    ),
                });
            },

            clearCart: () => set({ items: [] }),

            get totalItems() {
                return get().items.reduce((sum, i) => sum + i.quantity, 0);
            },

            get totalPrice() {
                return get().items.reduce(
                    (sum, i) => sum + i.product.price * i.quantity,
                    0
                );
            },
        }),
        { name: 'mdc-cart' }
    )
);
