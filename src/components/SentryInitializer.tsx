'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * ⚡ SentryInitializer (Plan B)
 * Este componente fuerza el despertar de Sentry en Next.js 16/Turbopack
 * cuando el sistema automático falla.
 */
export default function SentryInitializer() {
  useEffect(() => {
    // Si ya existe Sentry inicializado en el navegador, no hagamos nada
    if (window && (window as unknown as { __SENTRY__: unknown }).__SENTRY__) {
      console.log('✅ Sentry ya estaba registrado en el navegador.');
      return;
    }

    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

    if (!dsn) return;
    
    try {
      Sentry.init({
        dsn,
        // Performance Monitoring
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
        // Replay de sesiones
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
        // Entorno de ejecución
        environment: process.env.NODE_ENV,
      });
    } catch {
      // Silenciar en producción
    }
  }, []);

  return null; // Este componente no renderiza nada visualmente
}
