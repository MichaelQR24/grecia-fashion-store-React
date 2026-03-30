"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { exportToCSV } from "@/utils/exportToCSV";
import type { WebhookCartItem } from "@/types";

// ----------------------------------------------------------------------
// SUB-COMPONENTE: GESTIÓN DE PEDIDOS Y ESTADOS
// ----------------------------------------------------------------------
export default function OrdersDashboard() {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'en_progreso' | 'vendido' | 'cancelado'>('all');
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // En un Ecommerce completo, integrariamos Stripe que escribiría en una tabla 'orders'
        // Esta función previene la falla si la tabla no existe, y provee DEMOS visuales
        const fetchOrders = async () => {
            const supabase = createClient();
            // 1. Obtener órdenes sin intentar un Join directo porque no hay Foreign Key a profiles
            const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

            if (ordersError) {
                console.error("Supabase Fetch Orders Error:", JSON.stringify(ordersError, null, 2));
            }

            if (!ordersError && ordersData) {
                // 2. Extraer user_ids únicos
                const userIds = [...new Set(ordersData.map(o => o.user_id).filter(Boolean))];

                // 3. Obtener perfiles para esos usuarios
                type ProfileData = { id: string; full_name: string; email: string; phone: string | null };
                let profilesMap: Record<string, ProfileData> = {};
                if (userIds.length > 0) {
                    const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email, phone').in('id', userIds);
                    if (profilesData) {
                        profilesMap = profilesData.reduce((acc, p) => {
                            acc[p.id] = p;
                            return acc;
                        }, {} as Record<string, ProfileData>);
                    }
                }

                const formattedOrders = ordersData.map(o => {
                    const profile = profilesMap[o.user_id] || null;
                    return {
                        id: o.id,
                        short_id: `ODR-${o.id.substring(0, 5).toUpperCase()}`,
                        created_at: o.created_at,
                        status: o.status || 'en_progreso',
                        total: o.total_amount,
                        items: typeof o.cart_items === 'string' ? JSON.parse(o.cart_items) : o.cart_items,
                        profiles: profile,
                        customer_name: o.customer_name || profile?.full_name || 'Sin Nombre',
                        customer_email: o.customer_email || profile?.email || '',
                        customer_phone: o.customer_phone || profile?.phone || ''
                    };
                });
                setOrders(formattedOrders);
            } else {
                // MOCKS visuales para que el cliente evalúe el panel
                setOrders([
                    {
                        id: 'ODR-9201',
                        short_id: 'ODR-9201',
                        created_at: new Date().toISOString(),
                        status: 'en_progreso',
                        total: 120.50,
                        items: [{ name: 'Jean Push Up', quantity: 1 }, { name: 'Body Reductor', quantity: 2 }],
                        profiles: { full_name: 'Ana García', email: 'ana.dg@gmail.com', phone: '+1(555)921-1234' }
                    },
                    {
                        id: 'ODR-9200',
                        created_at: new Date(Date.now() - 86400000).toISOString(),
                        status: 'vendido',
                        total: 85.00,
                        items: [{ name: 'Faja Reloj de Arena', quantity: 1 }],
                        profiles: { full_name: 'María López', email: 'maryl@hotmail.com', phone: '+1(305)456-7890' }
                    },
                    {
                        id: 'ODR-9195',
                        created_at: new Date(Date.now() - 172800000).toISOString(),
                        status: 'cancelado',
                        total: 45.00,
                        items: [{ name: 'Top Deportivo', quantity: 1 }],
                        profiles: { full_name: 'Laura Méndez', email: 'laura.m@ejemplo.com', phone: '+1(212)382-9900' }
                    }
                ]);
            }
            setIsLoading(false);
        };
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o => {
        const matchesFilter = filter === 'all' || o.status === filter;
        if (!searchQuery) return matchesFilter;

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            (o.short_id && o.short_id.toLowerCase().includes(searchLower)) ||
            (o.id && o.id.toLowerCase().includes(searchLower)) ||
            (o.customer_name?.toLowerCase().includes(searchLower)) ||
            (o.customer_email?.toLowerCase().includes(searchLower)) ||
            (o.customer_phone?.includes(searchLower));

        return matchesFilter && matchesSearch;
    });

    const updateOrderStatus = async (id: string, newStatus: string) => {
        // Update optimista de UI
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));

        // Update base de datos real (cuando exista)
        const supabase = createClient();
        await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    };

    return (
        <div className="bg-[#0a0a0a] border border-gray-800/80 p-8 rounded-3xl shadow-2xl animate-fade-in-up">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 border-b border-gray-800/50 pb-6 gap-4">
                <div>
                    <h3 className="text-xl font-serif text-white flex items-center gap-3">
                        <i className="fas fa-shopping-bag text-grecia-accent"></i> Gestión de Pedidos
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                        Monitorea y cambia el estado de las compras
                    </p>
                    <button onClick={() => {
                        const dataToExport = filteredOrders.map(o => ({
                            OrderID: o.short_id || o.id,
                            Cliente: o.customer_name || 'Desconocido',
                            Email: o.customer_email || '',
                            Total_USD: Number(o.total || 0).toFixed(2),
                            Estado: o.status,
                            FechaVenta: new Date(o.created_at).toLocaleDateString()
                        }));
                        exportToCSV(dataToExport, 'Reporte_Ventas.csv');
                    }} className="mt-4 flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest transition w-fit shadow-lg">
                        <i className="fas fa-file-excel"></i> Exportar a Excel
                    </button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Buscador de Oden */}
                    <div className="relative w-full md:w-64">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
                        <input
                            type="text"
                            placeholder="Buscar orden, nombre o telf..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#111] border border-gray-800 text-white text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-[#FFC107] transition"
                        />
                    </div>

                    {/* Filtros */}
                    <div className="flex bg-[#111] p-1.5 rounded-full border border-gray-800 overflow-x-auto max-w-full">
                        <button onClick={() => setFilter('all')} className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition whitespace-nowrap ${filter === 'all' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>Todos</button>
                        <button onClick={() => setFilter('en_progreso')} className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition flex items-center gap-1.5 whitespace-nowrap ${filter === 'en_progreso' ? 'bg-[#FFC107] text-black shadow-md' : 'text-gray-500 hover:text-[#FFC107]'}`}><div className={`w-1.5 h-1.5 rounded-full ${filter === 'en_progreso' ? 'bg-black' : 'bg-[#FFC107]'}`}></div> En Progreso</button>
                        <button onClick={() => setFilter('vendido')} className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition flex items-center gap-1.5 whitespace-nowrap ${filter === 'vendido' ? 'bg-green-500 text-black shadow-md' : 'text-gray-500 hover:text-green-500'}`}><div className={`w-1.5 h-1.5 rounded-full ${filter === 'vendido' ? 'bg-black' : 'bg-green-500'}`}></div> Vendido</button>
                        <button onClick={() => setFilter('cancelado')} className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition flex items-center gap-1.5 whitespace-nowrap ${filter === 'cancelado' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-red-500'}`}><div className={`w-1.5 h-1.5 rounded-full ${filter === 'cancelado' ? 'bg-white' : 'bg-red-500'}`}></div> Cancelada</button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500">
                    <i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-[#FFC107]"></i>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-[#111] rounded-xl border border-gray-800">
                    <i className="fas fa-box-open text-4xl text-gray-700 mb-4"></i>
                    <p className="font-medium text-white mb-1">No hay pedidos filtrados</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => {
                        const discountInfo = order.items?.find((item: WebhookCartItem) => item.isMetadata && item.type === 'discount_info');
                        const realItems = order.items?.filter((item: WebhookCartItem) => !item.isMetadata) || [];

                        return (
                            <div key={order.id} className="bg-[#111] border border-gray-800 rounded-xl p-6 flex flex-col lg:flex-row justify-between gap-6 hover:border-gray-600 transition">
                                {/* Cliente e Items */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-white font-bold text-sm tracking-wider uppercase">{order.short_id || order.id}</span>
                                        <span className="text-gray-600 text-[10px]">•</span>
                                        <span className="text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-xs">
                                            <i className="fas fa-user"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-200 font-medium">{order.customer_name}</p>
                                            <p className="text-[10px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                                {order.customer_email && <span><i className="fas fa-envelope mr-1"></i> {order.customer_email}</span>}
                                                {order.customer_phone && <span><i className="fas fa-phone mr-1"></i> {order.customer_phone}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-gray-800 rounded p-3 text-xs text-gray-400">
                                        <strong className="text-white uppercase text-[9px] tracking-widest block mb-3">Artículos del Pedido ({realItems.length}):</strong>
                                        <div className="space-y-2">
                                            {realItems.map((item: WebhookCartItem, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 bg-[#111] border border-gray-800/50 rounded-lg p-2 hover:border-gray-700 transition">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-12 h-12 object-cover rounded-md border border-gray-800 flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-900 rounded-md border border-gray-800 flex items-center justify-center flex-shrink-0">
                                                            <i className="fas fa-image text-gray-700"></i>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-200 font-medium text-xs truncate">{item.name}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">
                                                            Cant: <span className="text-white font-bold">{item.quantity}</span>
                                                            {item.price && <span className="ml-2">· ${Number(item.price).toFixed(2)} c/u</span>}
                                                        </p>
                                                    </div>
                                                    {item.price && item.quantity && (
                                                        <span className="text-gray-300 font-bold text-xs whitespace-nowrap">
                                                            ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones de Cambio de Estado y Total */}
                                <div className="flex flex-col justify-between items-end min-w-[200px] border-t lg:border-t-0 lg:border-l border-gray-800 pt-4 lg:pt-0 lg:pl-6">
                                    <div className="text-right mb-4">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Monto Pagado</p>

                                        {discountInfo ? (
                                            <div className="flex flex-col items-end">
                                                <p className="text-sm font-serif text-gray-500 line-through mb-0.5">
                                                    ${Number(discountInfo.originalSubtotal).toFixed(2)}
                                                </p>
                                                <p className="text-2xl font-serif text-[#ff69b4] drop-shadow-md">
                                                    ${Number(order.total).toFixed(2)}
                                                </p>
                                                <p className="text-[9px] uppercase tracking-widest text-green-400 mt-1.5 px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20 inline-flex items-center gap-1 shadow-sm">
                                                    <i className="fas fa-tag"></i> {discountInfo.code} (-${Number(discountInfo.amount).toFixed(2)})
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-2xl font-serif text-white">${Number(order.total).toFixed(2)}</p>
                                        )}
                                    </div>

                                    <div className="w-full">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 text-right">Evolución de Pedido</p>
                                        <div className="flex gap-2 justify-end">
                                            {order.status !== 'en_progreso' && (
                                                <button onClick={() => updateOrderStatus(order.id, 'en_progreso')} className="w-8 h-8 rounded bg-[#111] border border-[#FFC107]/50 text-[#FFC107] hover:bg-[#FFC107] hover:text-black transition" title="Marcar En Progreso (Preparando)">
                                                    <i className="fas fa-clock"></i>
                                                </button>
                                            )}
                                            {order.status !== 'vendido' && (
                                                <button onClick={() => updateOrderStatus(order.id, 'vendido')} className="w-8 h-8 rounded bg-[#111] border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-black transition" title="Marcar como Vendido (Enviado a Cliente)">
                                                    <i className="fas fa-check-double"></i>
                                                </button>
                                            )}
                                            {order.status !== 'cancelado' && (
                                                <button onClick={() => updateOrderStatus(order.id, 'cancelado')} className="w-8 h-8 rounded bg-[#111] border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition" title="Cancelar Venta">
                                                    <i className="fas fa-ban"></i>
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-3 text-right">
                                            <span className={`px-3 py-1 bg-opacity-10 border text-[10px] uppercase tracking-widest font-bold rounded-full inline-block
                                            ${order.status === 'en_progreso' ? 'bg-[#FFC107] text-[#FFC107] border-[#FFC107]/30' :
                                                    order.status === 'vendido' ? 'bg-green-500 text-green-500 border-green-500/30' :
                                                        'bg-red-500 text-red-500 border-red-500/30'}
                                        `}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
