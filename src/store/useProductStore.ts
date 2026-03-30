import { create } from 'zustand';
import { Product } from '@/types';

interface ProductState {
    products: Product[];
    isLoaded: boolean;
    refreshProducts: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
    updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<boolean>;
    deleteProduct: (id: string) => Promise<boolean>;
    initialize: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoaded: false,

    refreshProducts: async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                set({ products: data, isLoaded: true });
            }
        } catch {
            console.error("Error manual refresh");
        }
    },

    initialize: () => {
        if (get().isLoaded) return;
        get().refreshProducts();
    },

    addProduct: async (product) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (res.ok) {
                await get().refreshProducts();
                return true;
            } else {
                const data = await res.json();
                console.error("Error API:", data.error);
                return false;
            }
        } catch {
            console.error("Falla en Servidor al añadir producto");
            return false;
        }
    },

    updateProduct: async (id, product) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (res.ok) {
                await get().refreshProducts();
                return true;
            } else {
                console.error("Error API:", await res.json());
                return false;
            }
        } catch {
            console.error("Falla en Servidor al actualizar");
            return false;
        }
    },

    deleteProduct: async (id) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await get().refreshProducts();
                return true;
            } else {
                console.error("Error API:", await res.json());
                return false;
            }
        } catch {
            console.error("Falla en Servidor al borrar");
            return false;
        }
    }
}));
