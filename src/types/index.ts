export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    image: string;
    colors?: string[];
    is_offer?: boolean;
    is_new?: boolean;
    is_bestseller?: boolean;
}

export interface CartItem extends Product {
    quantity: number;
}

/** Item del carrito enviado desde el frontend al API */
export interface CartItemRequest {
    id: string;
    quantity: number;
}

/** Item reconstruido desde Stripe line_items en el webhook */
export interface WebhookCartItem {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    isMetadata?: boolean;
    type?: 'discount_info';
    code?: string;
    amount?: number;
    originalSubtotal?: number;
}

/** Metadato de descuento inyectado en el carrito del webhook */
export interface DiscountMetadata {
    isMetadata: true;
    type: 'discount_info';
    code: string;
    amount: number;
    originalSubtotal?: number;
}

/** Datos del perfil del usuario (user_metadata de Supabase) */
export interface UserProfileData {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    role?: 'admin' | 'user';
}

/** Registro de orden guardada en Supabase */
export interface Order {
    id: string;
    user_id: string;
    stripe_session_id: string;
    total_amount: number;
    cart_items: WebhookCartItem[];
    status: 'paid' | 'en_progreso' | 'vendido' | 'cancelado';
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    created_at: string;
}

export interface UserProfile {
    email?: string;
    full_name?: string;
    id?: string;
    [key: string]: string | undefined;
}

export type UserRole = "admin" | "user" | null;
