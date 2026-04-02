import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { pathname } = request.nextUrl;

    // 🚀 Lógica de Cero-Latencia: Evitar llamadas a API si no es una ruta protegida
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/user')) {
        return supabaseResponse;
    }

    // 🔥 Obtención local para no ahogar a Supabase en concurrencia masiva
    const { data: { session } } = await supabase.auth.getSession();
    let user = null;
    let isAdminRole = false;

    if (session?.access_token) {
        const secret = process.env.SUPABASE_JWT_SECRET;
        if (secret) {
            try {
                // Decodificación y validación matemática de JWT (0 milisegundos en el Edge)
                const encodedSecret = new TextEncoder().encode(secret);
                const { payload } = await jwtVerify(session.access_token, encodedSecret);
                // @ts-ignore
                user = { id: payload.sub, user_metadata: payload.user_metadata, app_metadata: payload.app_metadata };
                // @ts-ignore
                isAdminRole = payload.app_metadata?.role === 'admin';
            } catch (err) {
                console.error('Fallo criptográfico local validando JWT:', err);
                user = null; // Rechazar acceso si el token fue manipulado (Seguridad activa)
            }
        } else {
            // Fallback en caso de que olvides colocar la variable SUPABASE_JWT_SECRET
            console.warn('⚠️ SUPABASE_JWT_SECRET indefinido. Haciendo fallback a getUser().');
            const { data: { user: apiUser } } = await supabase.auth.getUser();
            user = apiUser;
            const { isAdmin } = await import('@/lib/permissions');
            isAdminRole = isAdmin(user);
        }
    }

    // RUTAS PROTEGIDAS /admin
    if (pathname.startsWith('/admin')) {
        if (!user || !isAdminRole) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // RUTAS PROTEGIDAS /user
    if (pathname.startsWith('/user')) {
        if (!user) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return supabaseResponse;
}
