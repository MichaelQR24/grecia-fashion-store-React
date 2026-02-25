import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';

// Middleware interno para verificar sesion
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Acceso denegado. No hay sesión.' };

    if (user.email !== 'greciafashionstore2@gmail.com') {
        return { error: 'No autorizado. Se requiere rol de administrador.' };
    }
    return { success: true };
}

// --- ACTUALIZAR UN PRODUCTO (PUT) ---
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await verifyAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        // En Next.js 15+ "params" es una Promesa
        const { id } = await context.params;
        const updates = await request.json();

        // Utilizar el cliente SSR autenticado para pasar las reglas RLS
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('products')
            .update({
                name: updates.name,
                price: Number(updates.price),
                category: updates.category,
                stock: Number(updates.stock),
                image: updates.image,
                colors: updates.colors || [],
                is_bestseller: updates.is_bestseller || false,
                is_new: updates.is_new || false,
                is_offer: updates.is_offer || false
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

        // Utilizar el cliente SSR autenticado para pasar las reglas RLS
        const supabase = await createClient();

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
