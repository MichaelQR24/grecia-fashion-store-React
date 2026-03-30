import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/permissions';

// ISR: regenerar la caché del catálogo cada 60 segundos
export const revalidate = 60;

// --- 1. LECTURA (GET) - Público ---
export async function GET() {
    try {
        const { data: products, error } = await supabasePublic
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(products || []);
    } catch {
        return NextResponse.json(
            { error: 'Error leyendo el catálogo de productos.' },
            { status: 500 }
        );
    }
}

// --- 2. ESCRITURA (POST) - Protegido (Solo Administradores) ---
export async function POST(request: Request) {
    try {
        // A. VERIFICACIÓN DE SEGURIDAD SUPABASE SSR
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Acceso denegado. No hay sesión válida.' }, { status: 401 });

        if (!isAdmin(user)) {
            return NextResponse.json({ error: 'Privilegios insuficientes. Sólo administradores pueden crear productos.' }, { status: 403 });
        }

        // B. LOGICA DE CREACION DE PRODUCTO (CRUD)
        const newProductData = await request.json();

        const { data: insertedProduct, error } = await supabase
            .from('products')
            .insert([{
                name: newProductData.name,
                price: Number(newProductData.price),
                category: newProductData.category,
                stock: Number(newProductData.stock),
                image: newProductData.image,
                colors: newProductData.colors || [],
                is_bestseller: newProductData.is_bestseller || false,
                is_new: newProductData.is_new || false,
                is_offer: newProductData.is_offer || false
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(
            { success: true, message: 'Producto guardado en Servidor Seguro', product: insertedProduct },
            { status: 201 }
        );

    } catch {
        return NextResponse.json(
            { error: 'Error interno guardando tu producto en Supabase.' },
            { status: 500 }
        );
    }
}
