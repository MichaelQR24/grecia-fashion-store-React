import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'miclavesecretamuysegura-123456789'
);

// Helper function to verify admin
async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return { error: 'Acceso denegado.' };

    try {
        const verified = await jwtVerify(token, SECRET_KEY);
        if (verified.payload.role !== 'admin') {
            return { error: 'Privilegios insuficientes.' };
        }
        return { success: true };
    } catch {
        return { error: 'Token inválido.' };
    }
}

export async function POST(request: Request) {
    try {
        // 1. Verificar Seguridad: Solo administradores pueden subir fotos al bucket
        const auth = await verifyAdmin();
        if (auth.error) return NextResponse.json({ success: false, message: auth.error }, { status: 401 });

        // 2. Extraer el archivo de la petición
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, message: 'Ningún archivo enviado.' }, { status: 400 });
        }

        // 3. Preparar metadatos para Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        // 4. Subir a Supabase Storage (Bucket: 'products')
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false // No sobreescribir si por raro que parezca chocan nombres al azar
            });

        if (uploadError) {
            console.error("Storage Error Details:", uploadError);
            return NextResponse.json({ success: false, message: `Falla en Supabase Storage: ${uploadError.message}` }, { status: 500 });
        }

        // 5. Obtener la URL Pública absoluta generada por Supabase
        const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        // 6. Retornar la URL al AdminDashboard para que prosiga guardando el producto
        return NextResponse.json({
            success: true,
            imageUrl: publicUrlData.publicUrl
        });

    } catch (e: any) {
        console.error('Error interno del motor de subida:', e);
        return NextResponse.json({ success: false, message: `Excepción Nube: ${e.message || 'Desconocido'}` }, { status: 500 });
    }
}
