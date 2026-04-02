import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
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

    // 🔥 Ahora que evitamos el middleware en rutas públicas, consultar getUser() 
    // exclusivamente en rutas privadas es 100% seguro, infalible y óptimo.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    let isAdminRole = false;
    if (user) {
        const { isAdmin } = await import('@/lib/permissions');
        isAdminRole = isAdmin(user);
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
