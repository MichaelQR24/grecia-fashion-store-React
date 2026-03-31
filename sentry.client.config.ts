import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

    // Performance Monitoring: Captura el 20% de las transacciones en producción
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Replay de sesiones: Solo en producción para depurar errores visuales
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,

    // Solo habilitar Sentry si el DSN está configurado
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN || !!process.env.SENTRY_DSN,

    // Entorno de ejecución
    environment: process.env.NODE_ENV,
});

if (typeof window !== 'undefined') {
    console.log('🚀 [SENTRY CLIENT] Intentando inicialización...');
    console.log('📡 DSN Detectado:', process.env.NEXT_PUBLIC_SENTRY_DSN ? 'SÍ' : 'NO (VACÍO)');
}
