"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { UserProfileData } from "@/types";

export default function ProfileForm({ initialData }: { initialData: UserProfileData }) {
    const [name, setName] = useState(initialData?.name || "");
    const [phone, setPhone] = useState(initialData?.phone || "");
    const [address, setAddress] = useState(initialData?.address || "");
    const [city, setCity] = useState(initialData?.city || "");

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage("");

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            data: {
                name,
                phone,
                address,
                city
            }
        });

        if (error) {
            setSaveMessage("❌ Error al guardar los datos.");
        } else {
            setSaveMessage("✅ Datos actualizados correctamente.");
            setTimeout(() => setSaveMessage(""), 3000);
        }
        setIsSaving(false);
    };

    return (
        <div className="bg-[#111] border border-gray-800 rounded-lg p-8 mb-6">
            <h2 className="text-xl font-serif font-bold text-white mb-6 border-b border-gray-800 pb-4">
                <i className="fas fa-address-card text-gray-500 mr-2"></i> Mis Datos de Envío
            </h2>

            <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Nombre Completo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded text-sm focus:border-grecia-accent focus:bg-[#151515] outline-none transition"
                            placeholder="Ej. María López" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Teléfono de Contacto</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                            className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded text-sm focus:border-grecia-accent focus:bg-[#151515] outline-none transition"
                            placeholder="Ej. +1 555 123 4567" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Dirección de Envío Completa</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                        className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded text-sm focus:border-grecia-accent focus:bg-[#151515] outline-none transition"
                        placeholder="Ej. 123 Fashion Street, Apt 4B" />
                </div>

                <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Ciudad / Estado</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)}
                        className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded text-sm focus:border-grecia-accent focus:bg-[#151515] outline-none transition"
                        placeholder="Ej. New Jersey, NJ" />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <button type="submit" disabled={isSaving} className="bg-white text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-grecia-accent hover:text-white transition disabled:opacity-50">
                        {isSaving ? "Guardando..." : "Guardar Datos"}
                    </button>
                    {saveMessage && (
                        <span className={`text-xs ${saveMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                            {saveMessage}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
