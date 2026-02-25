import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
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
            message: 'Registro exitoso. Ya puedes iniciar sesión.',
            role: 'user'
        });
    } catch {
        return NextResponse.json(
            { success: false, message: 'Error procesando registro contra Supabase.' },
            { status: 500 }
        );
    }
}
