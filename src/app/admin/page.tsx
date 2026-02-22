import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import AdminDashboard from "@/app/admin/AdminDashboard"; // Un nuevo Client Component

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'miclavesecretamuysegura-123456789'
);

export default async function AdminPage() {
    // 1. Doble Verifición Server-Side del Token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    let userRole = null;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, SECRET_KEY);
            userRole = payload.role;
        } catch {
            console.error("Token admin inválido");
        }
    }

    // 2. Si forzaron la entrada sin ser Admin (fallback del middleware)
    if (userRole !== "admin") {
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
