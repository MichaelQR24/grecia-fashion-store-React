/**
 * Next.js Instrumentation Hook
 * Se ejecuta automáticamente al iniciar el servidor.
 * Carga la configuración de Sentry según el runtime activo.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('../sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        await import('../sentry.edge.config');
    }
}

// Next.js 15+: Captura automática de errores de request no manejados
export { captureRequestError as onRequestError } from '@sentry/nextjs';
