import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
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

        // Definir Rol dinámicamente: Si el correo es el asignado al admin, darle privilegios.
        const role = data.user.email === 'greciafashionstore2@gmail.com' ? 'admin' : 'user';

        return NextResponse.json({ success: true, role });
    } catch {
        return NextResponse.json(
            { success: false, message: 'Error procesando login contra Supabase.' },
            { status: 500 }
        );
    }
}
