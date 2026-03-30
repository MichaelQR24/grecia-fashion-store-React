import { User } from '@supabase/supabase-js';

/**
 * Verifica si un usuario tiene privilegios de administrador.
 * Depende exclusivamente de los metadatos del usuario en Supabase.
 * 
 * Para otorgar acceso de admin, asignar en Supabase:
 *   user_metadata.role = 'admin'
 * 
 * @param user El objeto de usuario autenticado de Supabase
 * @returns true si el usuario es administrador, false en caso contrario
 */
export function isAdmin(user: User | null | undefined): boolean {
    if (!user) return false;

    // ✅ Única fuente de verdad: user_metadata.role asignado en Supabase
    return user.user_metadata?.role === 'admin';
}
