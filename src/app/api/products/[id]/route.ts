import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'miclavesecretamuysegura-123456789'
);

// Middleware interno para verificar tokens
async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return { error: 'Acceso denegado. No hay sesión.' };

    try {
        const verified = await jwtVerify(token, SECRET_KEY);
        if (verified.payload.role !== 'admin') {
            return { error: 'No autorizado. Se requiere rol de administrador.' };
        }
        return { success: true };
    } catch {
        return { error: 'Token inválido o manipulado.' };
    }
}

// --- ACTUALIZAR UN PRODUCTO (PUT) ---
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        // En Next.js 15+ "params" es una Promesa
        const { id } = await context.params;
        const updates = await request.json();

        const { data, error } = await supabase
            .from('products')
            .update({
                name: updates.name,
                price: Number(updates.price),
                category: updates.category,
                stock: Number(updates.stock),
                image: updates.image
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Producto actualizado.', product: data });
    } catch {
        return NextResponse.json({ error: 'Error interno actualizando el producto.' }, { status: 500 });
    }
}

// --- BORRAR UN PRODUCTO (DELETE) ---
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        const { id } = await context.params;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Producto eliminado exitosamente.' });
    } catch {
        return NextResponse.json({ error: 'Error interno al borrar el producto.' }, { status: 500 });
    }
}
