import { createClient } from '@/utils/supabase/server';
import UserDashboardClient from './UserDashboardClient';

export const metadata = {
    title: "Mi Perfil | Grecia Fashion Store"
}

export default async function UserDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
                <div className="bg-black/80 border border-red-900 rounded-lg p-10 max-w-lg w-full">
                    <i className="fas fa-lock text-5xl text-red-600 mb-6"></i>
                    <h1 className="text-2xl font-serif text-white font-bold mb-2">Acceso Denegado</h1>
                    <p className="text-gray-400 text-sm">Debes iniciar sesión para ver tu perfil de usuario.</p>
                </div>
            </div>
        );
    }

    // Obtener los datos del perfil (extendido)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Obtener Historial de Pedidos reales del Usuario
    const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <UserDashboardClient 
            initialUser={user} 
            initialProfile={profile || {}} 
            orders={orders || []} 
        />
    );
}
