import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/permissions';

// Helper function to verify admin
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Acceso denegado.' };

    if (!isAdmin(user)) {
        return { error: 'Privilegios insuficientes.' };
    }
    return { success: true };
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

        // 3. ✅ VALIDACIÓN DE SEGURIDAD DEL ARCHIVO
        const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
            return NextResponse.json(
                { success: false, message: `Extensión .${fileExt || '?'} no permitida. Solo: ${ALLOWED_EXTENSIONS.join(', ')}` },
                { status: 400 }
            );
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: `Tipo MIME "${file.type}" no permitido. Solo imágenes: ${ALLOWED_MIME_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, message: `Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 5MB.` },
                { status: 400 }
            );
        }

        // 4. Preparar metadatos para Supabase
        const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        // 4. Subir a Supabase Storage (Bucket: 'products')
        const { error: uploadError } = await supabasePublic.storage
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
        const { data: publicUrlData } = supabasePublic.storage
            .from('products')
            .getPublicUrl(filePath);

        // 6. Retornar la URL al AdminDashboard para que prosiga guardando el producto
        return NextResponse.json({
            success: true,
            imageUrl: publicUrlData.publicUrl
        });

    } catch (e: unknown) {
        console.error('Error interno del motor de subida:', e);
        return NextResponse.json({ success: false, message: `Excepción Nube: ${(e as Error).message || 'Desconocido'}` }, { status: 500 });
    }
}
