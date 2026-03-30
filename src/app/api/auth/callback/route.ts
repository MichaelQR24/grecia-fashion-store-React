import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const nextRaw = requestUrl.searchParams.get('next') ?? '/';

    // ✅ Sanitizar el parámetro 'next' para prevenir Open Redirect
    // Solo permitir rutas internas relativas (empiezan con '/' pero no con '//')
    const safeNext = (nextRaw.startsWith('/') && !nextRaw.startsWith('//')) ? nextRaw : '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Comprobar el rol dinámicamente vía user_metadata
            const { data: { user } } = await supabase.auth.getUser();
            const { isAdmin } = await import('@/lib/permissions');

            if (isAdmin(user)) {
                return NextResponse.redirect(`${requestUrl.origin}/admin`);
            }

            return NextResponse.redirect(`${requestUrl.origin}${safeNext}`);
        }
    }

    // Retorna a inicio con un parámetro de error si la autenticación falla
    return NextResponse.redirect(`${requestUrl.origin}/?error=auth-callback-failed`);
}
