import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
    try {
        // ✅ Rate Limiting: máximo 3 registros por minuto por IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const limiter = rateLimit(`register:${ip}`, 3, 60_000);

        if (!limiter.allowed) {
            return NextResponse.json(
                { success: false, message: `Demasiados intentos de registro. Espera ${Math.ceil(limiter.retryAfterMs / 1000)}s.` },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(limiter.retryAfterMs / 1000)) } }
            );
        }

        const { email, password, phone } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    phone: phone || '',
                }
            }
        });

        if (error) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        // Si se requiere confirmación de email por defecto en Supabase:
        if (data.user?.identities?.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Este correo ya está registrado.' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '✅ ¡Cuenta creada exitosamente! Revisa tu bandeja de entrada (y la carpeta de Correo no deseado/Spam) para verificar tu enlace antes de iniciar sesión.',
            role: 'user'
        });
    } catch {
        return NextResponse.json(
            { success: false, message: 'Error procesando registro contra Supabase.' },
            { status: 500 }
        );
    }
}

