import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance Monitoring para Edge Runtime (Middleware)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Solo habilitar Sentry si el DSN está configurado
    enabled: !!process.env.SENTRY_DSN,

    environment: process.env.NODE_ENV,
});

console.log('✅ Sentry Edge Initialized with DSN:', process.env.SENTRY_DSN ? 'Present' : 'MISSING');
