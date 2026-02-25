import { createClient } from '@/utils/supabase/server';
import AdminDashboard from "@/app/admin/AdminDashboard"; // Un nuevo Client Component

export default async function AdminPage() {
    // 1. Doble Verificación Server-Side garantizada vía Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Si no hay usuario o no es el admin designado
    if (!user || user.email !== "greciafashionstore2@gmail.com") {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
                <div className="bg-black/80 border border-red-900 rounded-lg p-10 max-w-lg w-full">
                    <i className="fas fa-lock text-5xl text-red-600 mb-6"></i>
                    <h1 className="text-2xl font-serif text-white font-bold mb-2">Acceso Restringido</h1>
                    <p className="text-gray-400 text-sm">No tienes permisos de Administrador para ver esta página.</p>
                </div>
            </div>
        );
    }

    // 3. Renderizar el Dashboard Real
    return <AdminDashboard />;
}
