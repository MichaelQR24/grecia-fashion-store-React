"use client";

import { Product } from "@/types";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// ----------------------------------------------------------------------
// COMPONENTE: DASHBOARD ANALÍTICO LIGERO E INTUITIVO PARA EL CLIENTE
// ----------------------------------------------------------------------
export default function AnalyticsDashboard({ products }: { products: Product[] }) {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // Datos simulados inteligentes para el gráfico de línea (Tendencia)
    const trendData = months.map((m, i) => {
        const baseRev = 8000 + (i * 800);
        const seasonality = (i === 4 || i === 11) ? 3000 : 0; // Picos en Mayo (Madres) y Diciembre
        const pseudoRandom = (1500 * ((i * 123) % 100)) / 100;
        return {
            name: m,
            ingresos: baseRev + seasonality + pseudoRandom,
            ordenes: Math.floor((baseRev + seasonality) / 65)
        };
    });

    // Datos simulados para el gráfico de anillo (Categorías) a partir del catálogo real
    const categoryCount = products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.keys(categoryCount).length > 0
        ? Object.entries(categoryCount).map(([k, v], i) => ({ name: k, value: (v * 2000) + ((i * 345) % 1000) }))
        : [
            { name: "Jeans Levanta Cola", value: 8500 },
            { name: "Bodys Reductores", value: 5300 },
            { name: "Conjuntos Deportivos", value: 3200 }
        ];

    const COLORS = ['#DDA7A5', '#FFC107', '#4CAF50', '#8B0000', '#5c4033', '#111111'];

    const currentRevenue = trendData[11].ingresos;
    const currentOrders = trendData[11].ordenes;
    const avgTicket = currentRevenue / currentOrders;

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header Analítico */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-[#0a0a0a] border border-gray-800/80 p-6 rounded-2xl shadow-xl">
                <div>
                    <h2 className="text-xl font-serif text-white tracking-wide">Analítica y Rendimiento (Demo)</h2>
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest mt-1">Simulación proyectada basada en tu catálogo actual</p>
                </div>
            </div>

            {/* Tarjetas de KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] p-8 rounded-3xl border border-gray-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-grecia-accent/10 rounded-full blur-2xl group-hover:bg-grecia-accent/20 transition-all"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-grecia-accent/20 flex items-center justify-center text-grecia-accent text-xl">
                            <i className="fas fa-dollar-sign"></i>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Ingresos Brutos (Diciembre)</h3>
                    <p className="text-3xl md:text-5xl font-serif text-white tracking-tight">${currentRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                </div>

                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] p-8 rounded-3xl border border-gray-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-xl">
                            <i className="fas fa-shopping-bag"></i>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Órdenes Pagadas</h3>
                    <p className="text-3xl md:text-5xl font-serif text-white tracking-tight">{currentOrders.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] p-8 rounded-3xl border border-gray-800/80 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#FFC107]/10 rounded-full blur-2xl group-hover:bg-[#FFC107]/20 transition-all"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#FFC107]/20 flex items-center justify-center text-[#FFC107] text-xl">
                            <i className="fas fa-receipt"></i>
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-1">Ticket Promedio USD</h3>
                    <p className="text-3xl md:text-5xl font-serif text-white tracking-tight">${avgTicket.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Gráficos Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Líneas (Tendencias) */}
                <div className="bg-[#0a0a0a] border border-gray-800/80 p-8 rounded-3xl shadow-2xl">
                    <div className="mb-6">
                        <h3 className="text-lg font-serif text-white flex items-center gap-3">
                            <i className="fas fa-chart-line text-grecia-accent"></i> Tendencia Anual de Ingresos
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ventas en los últimos 12 meses (USD)</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#DDA7A5' }}
                                    formatter={(value: unknown) => [`$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 'Ingresos']}
                                />
                                <Line type="monotone" dataKey="ingresos" stroke="#DDA7A5" strokeWidth={3} dot={{ r: 4, fill: '#111', stroke: '#DDA7A5', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#DDA7A5' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Anillo (Categorías) */}
                <div className="bg-[#0a0a0a] border border-gray-800/80 p-8 rounded-3xl shadow-2xl">
                    <div className="mb-6">
                        <h3 className="text-lg font-serif text-white flex items-center gap-3">
                            <i className="fas fa-chart-pie text-[#FFC107]"></i> Distribución por Categoría
                        </h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">¿Qué productos generan más dinero?</p>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value: unknown) => [`$${Number(value).toLocaleString('en-US')}`, 'Ventas Est.']}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#bbb' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Alerta de Stock (Mantiene conectada a la base de datos real) */}
            <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-2xl flex items-center justify-between">
                <div>
                    <h4 className="text-red-400 font-bold text-sm mb-1"><i className="fas fa-exclamation-triangle mr-2"></i> Alerta de Inventario</h4>
                    <p className="text-gray-400 text-xs">
                        Tienes {products.filter(p => p.stock === 0).length} productos agotados y {products.filter(p => p.stock > 0 && p.stock <= 3).length} a punto de agotarse.
                    </p>
                </div>
                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="bg-red-950 hover:bg-red-900 text-red-300 px-4 py-2 rounded text-xs font-bold transition">
                    Revisar Inventario
                </button>
            </div>
        </div>
    );
}
