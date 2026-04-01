import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * 🛡️ Upstash Distributed Rate Limiter
 * 
 * Implementación robusta para entornos Serverless (Vercel Edge/Node).
 * A diferencia del Map en memoria, este contador persiste globalmente en Redis.
 */

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️ UPSTASH_REDIS_REST_URL o TOKEN no configurados. El Rate Limiting estará desactivado.');
}

// 1. Crear el cliente de Redis compatible con Edge
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Configuración del Escudo:
 * - Algoritmo: Sliding Window (más justo que Fixed Window)
 * - Límite: 5 solicitudes
 * - Ventana: 10 segundos
 */
export const upstashRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 s'),
    analytics: true,
    prefix: '@upstash/ratelimit', // Prefijo para las llaves en Redis
});

/**
 * Función auxiliar para obtener el resultado del límite de forma limpia
 */
export async function checkRateLimit(identifier: string) {
    // Si no hay credenciales, permitimos el paso para no romper la tienda (Fail Open)
    if (!process.env.UPSTASH_REDIS_REST_URL) {
        return { success: true, remaining: 1, reset: Date.now() };
    }

    try {
        const { success, limit, remaining, reset } = await upstashRateLimit.limit(identifier);
        return { success, limit, remaining, reset };
    } catch (error) {
        console.error('Error en Upstash RateLimit:', error);
        return { success: true, remaining: 1, reset: Date.now() }; // Fail Open por seguridad
    }
}
