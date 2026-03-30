"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { exportToCSV } from "@/utils/exportToCSV";

// ----------------------------------------------------------------------
// SUB-COMPONENTE: CRM DE CLIENTES REGISTRADOS
// ----------------------------------------------------------------------
export default function CustomersDashboard() {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchCustomers = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

            if (!error && data) {
                setCustomers(data);
            }
            setIsLoading(false);
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (c.full_name && c.full_name.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q))
        );
    });

    return (
        <div className="bg-[#0a0a0a] border border-gray-800/80 p-8 rounded-3xl shadow-2xl animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-gray-800/50 pb-4 gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <h3 className="text-xl font-serif text-white flex items-center gap-3">
                        <i className="fas fa-users text-[#FFC107]"></i> Directorio de Clientes (CRM)
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest bg-gray-900 border border-gray-800 px-3 py-1.5 rounded">
                            {filteredCustomers.length} Registros Activos
                        </span>
                        <button onClick={() => {
                            const dataToExport = filteredCustomers.map(c => ({
                                Nombre: c.full_name || 'Sin nombre',
                                Correo: c.email || 'Sin correo',
                                Celular: c.phone || 'Sin numero',
                                Direccion: c.address ? `${c.address}, ${c.city || ''}`.trim() : 'Sin direccion',
                                FechaRegistro: new Date(c.created_at).toLocaleDateString()
                            }));
                            exportToCSV(dataToExport, 'Directorio_Clientes.csv');
                        }} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest transition shadow-lg">
                            <i className="fas fa-file-excel"></i> Exportar CSV
                        </button>
                    </div>
                </div>

                <div className="relative w-full md:w-auto">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o celular..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 bg-[#111] border border-gray-800 text-white text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-grecia-accent transition"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500">
                    <i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-[#FFC107]"></i>
                    <p className="font-light text-sm">Cargando base de datos de clientes...</p>
                </div>
            ) : customers.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-[#111] rounded-xl border border-gray-800">
                    <i className="fas fa-user-slash text-4xl text-gray-700 mb-4"></i>
                    <p className="font-medium text-white mb-1">Aún no hay perfiles sincronizados</p>
                    <p className="text-xs">Los clientes que se registren o guarden datos de envío aparecerán aquí.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFC107]/5 rounded-bl-full -mr-4 -mt-4 group-hover:bg-[#FFC107]/10 transition"></div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-gray-400">
                                    <i className="fas fa-user"></i>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold max-w-[150px] truncate" title={customer.full_name || 'Sin Nombre'}>
                                        {customer.full_name || <span className="text-gray-600 italic">Nombre sin definir</span>}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 truncate" title={customer.email}>{customer.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center text-xs">
                                    <div className="w-6 text-center text-gray-600"><i className="fas fa-phone"></i></div>
                                    <span className={customer.phone ? 'text-gray-300' : 'text-gray-700 italic'}>
                                        {customer.phone || 'Teléfono no guardado'}
                                    </span>
                                    {customer.phone && (
                                        <a href={`tel:${customer.phone}`} className="ml-auto text-green-500 hover:text-green-400 cursor-pointer" title="Llamar">
                                            <i className="fas fa-phone-alt"></i>
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-start text-xs">
                                    <div className="w-6 text-center text-gray-600 mt-0.5"><i className="fas fa-map-marker-alt"></i></div>
                                    <div className="flex-1">
                                        <span className={customer.address ? 'text-gray-300' : 'text-gray-700 italic'}>
                                            {customer.address ? `${customer.address}, ${customer.city || ''}` : 'Dirección sin definir'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-gray-800/80 flex justify-between items-center text-[9px] uppercase tracking-widest text-gray-500">
                                <span>Cliente Verificado</span>
                                <span className="bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-[#FFC107]">Auth DB</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
