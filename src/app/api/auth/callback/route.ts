import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    // Si queremos redirigir a un lugar distinto por default (ej: el dashboard del user)
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Asumiendo que el inicio de sesión fue exitoso, comprobemos el rol dinámicamente
            const { data: { user } } = await supabase.auth.getUser();

            if (user?.email === 'greciafashionstore2@gmail.com') {
                return NextResponse.redirect(`${requestUrl.origin}/admin`);
            }

            return NextResponse.redirect(`${requestUrl.origin}${next}`);
        }
    }

    // Retorna a inicio con un parámetro de error si la autenticación falla
    return NextResponse.redirect(`${requestUrl.origin}/?error=auth-callback-failed`);
}
