"use client";

import { useAppContext } from "@/context/AppContext";

import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
    const { setUserRole } = useAppContext();

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            setUserRole(null);
            window.location.href = '/';
        } catch {
            console.error("Error cerrando sesión");
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full mt-2 bg-red-900/20 text-red-500 py-2 rounded border border-red-900/50 hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-2"
        >
            <i className="fas fa-sign-out-alt"></i> Cerrar Sesión Segura
        </button>
    );
}
