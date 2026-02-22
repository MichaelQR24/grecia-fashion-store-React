import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import LogoutButton from "@/components/ui/LogoutButton";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'miclavesecretamuysegura-123456789'
);

export default async function UserDashboard() {
    // 1. Verificación Server-Side del Token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    let userRole = null;
    let userEmail = "";

    if (token) {
        try {
            const { payload } = await jwtVerify(token, SECRET_KEY);
            userRole = payload.role as string;
            userEmail = payload.email as string || "cliente@grecia.com";
        } catch {
            console.error("Token de usuario inválido");
        }
    }

    // 2. Si no hay rol de user o admin, redirige (fallback de middleware)
    if (!userRole) {
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

                    {/* Historial de Compras (Mock) */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-[#111] border border-gray-800 rounded-lg p-8">
                            <h2 className="text-xl font-serif font-bold text-white mb-6 border-b border-gray-800 pb-4">
                                <i className="fas fa-shopping-bag text-gray-500 mr-2"></i> Mis Pedidos Recientes
                            </h2>
                            <div className="space-y-4">
                                {/* Pedido Mock 1 */}
                                <div className="p-4 border border-gray-800 rounded-lg flex justify-between items-center hover:bg-white/5 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center text-gray-500">
                                            <i className="fas fa-gem"></i>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Pedido #2491</p>
                                            <p className="text-xs text-gray-500">Completado el 12 de feb, 2026</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-grecia-accent font-bold text-sm">$85.00</p>
                                        <p className="text-[10px] text-green-500 uppercase tracking-wider">Entregado</p>
                                    </div>
                                </div>
                                {/* Pedido Mock 2 */}
                                <div className="p-4 border border-gray-800 rounded-lg flex justify-between items-center hover:bg-white/5 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center text-gray-500">
                                            <i className="fas fa-fire"></i>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Pedido #2405</p>
                                            <p className="text-xs text-gray-500">Completado el 05 de ene, 2026</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-grecia-accent font-bold text-sm">$160.00</p>
                                        <p className="text-[10px] text-green-500 uppercase tracking-wider">Entregado</p>
                                    </div>
                                </div>
                            </div>
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
