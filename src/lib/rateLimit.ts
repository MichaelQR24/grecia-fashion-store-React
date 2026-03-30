/**
 * Rate Limiter en memoria para proteger endpoints de autenticación.
 * Previene ataques de fuerza bruta y credential stuffing.
 * 
 * Limitaciones: Al ser in-memory, se reinicia con cada deploy/restart.
 * Para producción a gran escala, considerar Upstash Redis con @upstash/ratelimit.
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const attempts = new Map<string, RateLimitRecord>();

// Limpieza periódica para evitar memory leak (cada 5 minutos)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, record] of attempts.entries()) {
        if (now > record.resetAt) {
            attempts.delete(key);
        }
    }
}

/**
 * Verifica si una IP puede realizar un intento más.
 * @param identifier IP o identificador único del cliente
 * @param maxAttempts Máximo de intentos permitidos en la ventana
 * @param windowMs Duración de la ventana en milisegundos
 * @returns { allowed: boolean, remainingAttempts: number, retryAfterMs: number }
 */
export function rateLimit(
    identifier: string,
    maxAttempts: number = 5,
    windowMs: number = 60_000
): { allowed: boolean; remainingAttempts: number; retryAfterMs: number } {
    cleanup();

    const now = Date.now();
    const record = attempts.get(identifier);

    // Primera vez o ventana expirada → reiniciar conteo
    if (!record || now > record.resetAt) {
        attempts.set(identifier, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remainingAttempts: maxAttempts - 1, retryAfterMs: 0 };
    }

    // Dentro de la ventana y dentro del límite
    if (record.count < maxAttempts) {
        record.count++;
        return { allowed: true, remainingAttempts: maxAttempts - record.count, retryAfterMs: 0 };
    }

    // Bloqueado
    return { allowed: false, remainingAttempts: 0, retryAfterMs: record.resetAt - now };
}
