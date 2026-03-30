import { createClient } from '@/utils/supabase/server';
import LogoutButton from "@/components/ui/LogoutButton";
import ProfileForm from "./ProfileForm";
import Link from 'next/link';
import Image from 'next/image';
import { isAdmin } from "@/lib/permissions";

export default async function UserDashboard() {
    // 1. Verificación Server-Side de Sesión con Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userRole = null;
    let userEmail = "";

    if (user) {
        userEmail = user.email || "cliente@grecia.com";
        // Si el correo es el del administrador, le asignamos el rol
        userRole = isAdmin(user) ? 'admin' : 'user';
    }

    // 1.5 Obtener Historial de Pedidos del Usuario
    let orders: { id: string, total_amount: number, created_at: string, cart_items: { image: string, name: string }[] }[] = [];
    if (user) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data && !error) {
            orders = data;
        }
    }

    // 2. Si no hay usuario de Supabase, muestra acceso denegado
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

    return (
        <main className="min-h-screen bg-[#050505] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">

                <header className="mb-12 border-b border-gray-900 pb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">
                            <i className="fas fa-user-circle text-gray-500 mr-3"></i>
                            Mi Perfil
                        </h1>
                        <p className="text-sm text-gray-500">Bienvenida a tu espacio personal, {userEmail}</p>
                    </div>

                    <Link href="/" className="px-5 py-2.5 bg-gray-900 border border-gray-800 text-white hover:bg-white hover:text-black transition rounded hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] text-xs uppercase tracking-wider font-bold shadow-lg flex items-center gap-2">
                        <i className="fas fa-arrow-left"></i> Volver a Tienda
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Tarjeta de Información Básica */}
                    <div className="md:col-span-1 bg-[#111] border border-gray-800 rounded-lg p-6 h-fit">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <i className="fas fa-user text-3xl text-gray-500"></i>
                            </div>
                            <h2 className="text-lg font-bold text-white">{userRole === 'admin' ? 'Administrador' : 'Cliente Frecuente'}</h2>
                            <p className="text-xs text-grecia-accent">{userEmail}</p>
                        </div>
                        <div className="space-y-4 text-sm text-gray-400">
                            <div className="flex justify-between border-b border-gray-800 pb-2">
                                <span>Compras Rápidas</span>
                                <span className="text-white">Activado</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-800 pb-2">
                                <span>Notificaciones</span>
                                <span className="text-white">Por Email</span>
                            </div>
                            <button className="w-full mt-4 bg-gray-900 text-white py-2 rounded border border-gray-800 hover:bg-white hover:text-black transition">
                                Editar Perfil
                            </button>
                            <LogoutButton />
                        </div>
                    </div>

                    {/* Tablero Principal (Perfil + Pedidos) */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Componente Creado Expresamente Para Llenar Metadatos */}
                        <ProfileForm initialData={user?.user_metadata || {}} />

                        {/* Historial de Compras */}
                        <div className="bg-[#111] border border-gray-800 rounded-lg p-8">
                            <h2 className="text-xl font-serif font-bold text-white mb-6 border-b border-gray-800 pb-4">
                                <i className="fas fa-shopping-bag text-gray-500 mr-2"></i> Mis Pedidos Recientes
                            </h2>
                            {orders && orders.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="bg-black border border-gray-800 rounded p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">Orden <span className="text-gray-500 text-xs">#{order.id.split('-')[0]}</span></p>
                                                <p className="text-white font-bold">${order.total_amount.toFixed(2)} USD</p>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>

                                            <div className="flex -space-x-3">
                                                {/* Mostrar miniaturas de los items comprados (excluir metadata de descuento) */}
                                                {(order.cart_items).filter(i => i.image && !('isMetadata' in i && i.isMetadata)).slice(0, 4).map((item, idx: number) => (
                                                    <div key={idx} className="relative w-10 h-10 rounded-full border border-gray-600 overflow-hidden" style={{ zIndex: 10 - idx }} title={item.name || 'Producto'}>
                                                        <Image src={item.image} alt={item.name || 'Producto'} width={40} height={40} className="object-cover rounded-full" />
                                                    </div>
                                                ))}
                                                {(order.cart_items).length > 4 && (
                                                    <div className="w-10 h-10 rounded-full border border-gray-800 bg-gray-900 flex items-center justify-center text-xs text-gray-400 relative" style={{ zIndex: 1 }}>
                                                        +{(order.cart_items).length - 4}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <span className="px-3 py-1 bg-green-900/30 text-green-500 text-xs border border-green-800 rounded-full">Completado</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                                        <i className="fas fa-box-open text-2xl"></i>
                                    </div>
                                    <p className="font-medium text-white mb-1">Aún no tienes pedidos registrados</p>
                                    <p className="text-xs">Tus compras futuras se listarán cronológicamente aquí.</p>
                                </div>
                            )}
                        </div>

                        {/* Favoritos */}
                        <div className="bg-[#111] border border-gray-800 rounded-lg p-8 text-center text-gray-500">
                            <i className="far fa-heart text-3xl mb-3"></i>
                            <p className="text-sm">Aún no tienes items en tu lista de deseos.</p>
                            <button className="mt-4 text-grecia-accent hover:text-white transition text-sm">Explorar Catálogo</button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
