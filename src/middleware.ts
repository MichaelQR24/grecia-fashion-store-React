import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'miclavesecretamuysegura-123456789'
);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ESTA REGLA PROTEGE TODA CARPETA /admin Y SUS ARCHIVOS
    if (pathname.startsWith('/admin')) {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) return NextResponse.redirect(new URL('/', request.url));

        try {
            const { payload } = await jwtVerify(token, SECRET_KEY);
            if (payload.role !== 'admin') {
                return NextResponse.redirect(new URL('/', request.url));
            }
            return NextResponse.next();
        } catch {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // ESTA REGLA PROTEGE TODA CARPETA /user Y SUS ARCHIVOS
    if (pathname.startsWith('/user')) {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) return NextResponse.redirect(new URL('/', request.url));

        try {
            await jwtVerify(token, SECRET_KEY);
            // Tanto admin como user pueden tener dashboard
            return NextResponse.next();
        } catch {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

// Configuración recomendada de Next.js de rutas restringibles
export const config = {
    matcher: ['/admin/:path*', '/user/:path*'],
};
