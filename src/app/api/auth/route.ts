import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'miclavesecretamuysegura-123456789'
);

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Validar credenciales hardcodeadas (Simulando DB de usuario)
        if (email === 'admin@grecia.com' && password === 'admin123') {

            // 1. Crear Token irrompible (JWT) con 'jose'
            const alg = 'HS256';
            const jwt = await new SignJWT({ role: 'admin', email })
                .setProtectedHeader({ alg })
                .setIssuedAt()
                .setExpirationTime('8h') // Expira en 8 horas
                .sign(SECRET_KEY);

            // 2. Guardar Token en Cookie HttpOnly (El Hacker no puede verlo por JS)
            const cookieStore = await cookies();
            cookieStore.set('auth_token', jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 8, // 8 horas
            });

            return NextResponse.json({ success: true, role: 'admin' });
        }

        if (email === 'cliente@grecia.com' && password === '1234') {
            // Clientes normales tambien reciben token pero de rol limitidato
            const alg = 'HS256';
            const jwt = await new SignJWT({ role: 'user', email })
                .setProtectedHeader({ alg })
                .setIssuedAt()
                .setExpirationTime('8h')
                .sign(SECRET_KEY);

            const cookieStore = await cookies();
            cookieStore.set('auth_token', jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 8,
            });

            return NextResponse.json({ success: true, role: 'user' });
        }

        return NextResponse.json(
            { success: false, message: 'Credenciales inválidas' },
            { status: 401 }
        );
    } catch {
        return NextResponse.json(
            { success: false, message: 'Error procesando login' },
            { status: 500 }
        );
    }
}
