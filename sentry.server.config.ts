import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance Monitoring: Captura el 20% de las transacciones servidor en producción
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Solo habilitar Sentry si el DSN está configurado
    enabled: !!process.env.SENTRY_DSN,

    // Entorno de ejecución
    environment: process.env.NODE_ENV,
});

console.log('✅ Sentry Server Initialized with DSN:', process.env.SENTRY_DSN ? 'Present' : 'MISSING');
