"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Tipos requeridos
export type Product = {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    image: string;
    colors?: string[]; // Lista de códigos Hexadecimales
    is_offer?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
};

export type CartItem = Product & {
    quantity: number;
};

export type UserRole = "admin" | "user" | null;

interface AppContextType {
    userRole: UserRole;
    setUserRole: (role: UserRole) => void;
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
    updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<boolean>;
    deleteProduct: (id: string) => Promise<boolean>;
    refreshProducts: () => Promise<void>;

    // Cart features
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartItemQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Cargar Inventario Inicial desde API Backend (Real)
    // Se recomienda envolverlo en una carga async segura
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const res = await fetch('/api/products');
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) setProducts(data);
                }
            } catch {
                console.error("Error cargando DB inicial");
            }
        };
        load();

        return () => { isMounted = false; }
    }, []);

    // Metodo manual de Refresh
    const refreshProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch {
            console.error("Error manual refresh");
        }
    };

    // Función segura para guardar con JWT
    const addProduct = async (product: Omit<Product, 'id'>) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (res.ok) {
                // Si la BD de Servidor confirma, refrescamos el frente
                await refreshProducts();
                return true;
            } else {
                const data = await res.json();
                console.error("Error API:", data.error);
                return false;
            }
        } catch {
            console.error("Falla en Servidor");
            return false;
        }
    };

    // Función segura para actualizar un producto
    const updateProduct = async (id: string, product: Omit<Product, 'id'>) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (res.ok) {
                await refreshProducts();
                return true;
            } else {
                console.error("Error API:", await res.json());
                return false;
            }
        } catch {
            console.error("Falla en Servidor al actualizar");
            return false;
        }
    };

    // Función segura para borrar un producto
    const deleteProduct = async (id: string) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                await refreshProducts();
                return true;
            } else {
                console.error("Error API:", await res.json());
                return false;
            }
        } catch {
            console.error("Falla en Servidor al borrar");
            return false;
        }
    };

    // Funciones del Carrito
    const addToCart = (product: Product, quantity: number = 1) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                // Verificar no exceder stock (opcional aquí, o en la UI)
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > product.stock) {
                    alert('No hay suficiente stock disponible para añadir más.');
                    return prevCart;
                }
                return prevCart.map((item) =>
                    item.id === product.id ? { ...item, quantity: newQuantity } : item
                );
            }
            if (quantity > product.stock) {
                alert('No hay suficiente stock disponible.');
                return prevCart;
            }
            return [...prevCart, { ...product, quantity }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    };

    const updateCartItemQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) => {
                if (item.id === productId) {
                    if (quantity > item.stock) {
                        alert('No hay suficiente stock disponible.');
                        return item;
                    }
                    return { ...item, quantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => setCart([]);

    return (
        <AppContext.Provider value={{
            userRole, setUserRole,
            products, addProduct, updateProduct, deleteProduct, refreshProducts,
            cart, addToCart, removeFromCart, updateCartItemQuantity, clearCart
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within an AppProvider");
    return context;
}
