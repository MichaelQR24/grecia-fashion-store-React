import { User } from '@supabase/supabase-js';

/**
 * Verifica si un usuario tiene privilegios de administrador.
 * Depende exclusivamente de los metadatos de aplicación (app_metadata) en Supabase.
 * 
 * NOTA DE SEGURIDAD: 
 * NUNCA uses user_metadata para seguridad porque el usuario puede modificarlo.
 * app_metadata solo puede ser modificado por el back-end o mediante el servicio rol (Administrador).
 * 
 * @param user El objeto de usuario autenticado de Supabase
 * @returns true si el usuario es administrador, false en caso contrario
 */
export function isAdmin(user: User | null | undefined): boolean {
    if (!user) return false;

    // ✅ Única fuente de verdad infalsificable: app_metadata.role
    return user.app_metadata?.role === 'admin';
}
