import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/permissions';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
    try {
        // ✅ Rate Limiting: máximo 5 intentos de login por minuto por IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || 'unknown';
        const limiter = rateLimit(`login:${ip}`, 5, 60_000);

        if (!limiter.allowed) {
            return NextResponse.json(
                { success: false, message: `Demasiados intentos. Espera ${Math.ceil(limiter.retryAfterMs / 1000)}s.` },
                { status: 429, headers: { 'Retry-After': String(Math.ceil(limiter.retryAfterMs / 1000)) } }
            );
        }

        const { email, password } = await request.json();
        const supabase = await createClient();

        // Solicitar Autenticación Real al Servidor
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            return NextResponse.json(
                { success: false, message: 'Credenciales inválidas o usuario inexistente.' },
                { status: 401 }
            );
        }

        // Definir Rol dinámicamente vía user_metadata
        const role = isAdmin(data.user) ? 'admin' : 'user';

        return NextResponse.json({ success: true, role });
    } catch {
        return NextResponse.json(
            { success: false, message: 'Error procesando login contra Supabase.' },
            { status: 500 }
        );
    }
}

