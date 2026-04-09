import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'mnkcadiijsglpjlcahxa.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: blob: https://mnkcadiijsglpjlcahxa.supabase.co https://images.unsplash.com",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "frame-src https://js.stripe.com https://maps.google.com",
              "connect-src 'self' https://mnkcadiijsglpjlcahxa.supabase.co wss://mnkcadiijsglpjlcahxa.supabase.co https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  experimental: {
    // Evita cargar todos los módulos de estas librerías, ahorrando megabytes en el servidor y acelerando el arranque (Cold Start) en Vercel.
    optimizePackageImports: ['stripe', 'recharts', 'lucide-react', 'react-hot-toast', '@supabase/supabase-js'],
  },
};

// ✅ R3: Sentry build instrumentation
// Esta configuración es robusta: si no hay token o DSN, no rompe el build.
export default withSentryConfig(nextConfig, {
  // Subida de Source Maps para poder ver stack traces legibles en Sentry
  org: process.env.SENTRY_ORG || 'grecia-fashion-store',
  project: process.env.SENTRY_PROJECT || 'javascript-nextjs',

  // Solo subir source maps si tenemos el token; así evitamos que el build falle en CI sin credenciales
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silenciar logs de Sentry para no ensuciar el despliegue
  silent: true,

  // Optimización (evita agotar la RAM durante el build)
  widenClientFileUpload: true,
});

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
