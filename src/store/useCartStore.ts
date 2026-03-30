import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { Product, CartItem } from '@/types';

interface CartState {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartItemQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cart: [],

            addToCart: (product: Product, quantity: number = 1) => {
                const { cart } = get();
                const existingItem = cart.find((item) => item.id === product.id);

                if (existingItem) {
                    const newQuantity = existingItem.quantity + quantity;
                    if (newQuantity > product.stock) {
                        toast.error('No hay suficiente stock disponible para añadir más.');
                        return;
                    }
                    
                    set({
                        cart: cart.map((item) =>
                            item.id === product.id ? { ...item, quantity: newQuantity } : item
                        )
                    });
                    toast.success(`${product.name} agregado al carrito`);
                } else {
                    if (quantity > product.stock) {
                        toast.error('No hay suficiente stock disponible.');
                        return;
                    }
                    
                    set({ cart: [...cart, { ...product, quantity }] });
                    toast.success(`${product.name} agregado al carrito`);
                }
            },

            removeFromCart: (productId: string) => {
                set({ cart: get().cart.filter((item) => item.id !== productId) });
            },

            updateCartItemQuantity: (productId: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeFromCart(productId);
                    return;
                }
                
                const { cart } = get();
                const updatedCart = cart.map((item) => {
                    if (item.id === productId) {
                        if (quantity > item.stock) {
                            toast.error('No hay suficiente stock disponible.');
                            return item; // Deja la cantidad intacta
                        }
                        return { ...item, quantity };
                    }
                    return item;
                });
                
                set({ cart: updatedCart });
            },

            clearCart: () => set({ cart: [] }),
        }),
        {
            name: 'grecia-cart-storage', // name of the item in the storage (must be unique)
        }
    )
);
