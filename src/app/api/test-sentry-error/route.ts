import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    console.log('--- TEST: Disparando error en el servidor (API) ---');
    
    // Provocar un error de referencia para que Sentry lo capture automáticamente
    try {
        // @ts-ignore
        const result = serverUndefinedFunction();
        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Error en API capturado:', error);
        throw error; // Re-lanzamos para que el middleware de Sentry o instrumentation lo capture
    }
}
