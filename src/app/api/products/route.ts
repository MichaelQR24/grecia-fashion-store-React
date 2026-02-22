import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'miclavesecretamuysegura-123456789'
);

// --- 1. LECTURA (GET) - Público ---
export async function GET() {
    try {
        const { data: products, error } = await supabase
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
        // A. VERIFICACIÓN DE SEGURIDAD JWT (Anti-Hackers)
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return NextResponse.json({ error: 'Acceso denegado. No hay sesión válida.' }, { status: 401 });

        let payload;
        try {
            const verified = await jwtVerify(token, SECRET_KEY);
            payload = verified.payload;
        } catch {
            return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
        }

        if (payload.role !== 'admin') {
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
                image: newProductData.image
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
