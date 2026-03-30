"use client";

import { useState } from "react";
import { useProductStore } from "@/store/useProductStore";
import LogoutButton from "@/components/ui/LogoutButton";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CustomersDashboard from "./components/CustomersDashboard";
import OrdersDashboard from "./components/OrdersDashboard";
import DiscountsDashboard from "./components/DiscountsDashboard";
import InventoryManagement from "./components/InventoryManagement";

export default function AdminDashboard() {
    const { products } = useProductStore();

    // Pestañas (Tabs)
    const [activeTab, setActiveTab] = useState<'inventory' | 'analytics' | 'customers' | 'orders' | 'discounts'>('inventory');

    return (
        <main className="min-h-screen bg-[#050505] pt-32 pb-20 relative overflow-hidden">
            {/* Efecto de luz de fondo sutil */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-grecia-accent/5 to-transparent pointer-events-none"></div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <header className="mb-8 border-b border-gray-800/50 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <span className="text-grecia-accent text-[10px] tracking-[0.3em] font-bold uppercase mb-2 block">
                            Centro de Control
                        </span>
                        <h1 className="text-3xl md:text-4xl font-serif font-light text-white mb-2">
                            Gestión de <span className="italic text-gray-400 font-medium">Boutique</span>
                        </h1>
                        <p className="text-sm text-gray-500 font-light">
                            Administra el inventario en tiempo real con seguridad JWT y Supabase.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-6">
                        <LogoutButton />

                        {/* Selector de Pestañas (Tabs) */}
                        <div className="flex bg-[#111] p-1 rounded-full border border-gray-800/60 shadow-inner overflow-x-auto max-w-full hide-scrollbar">
                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={`px-4 lg:px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${activeTab === 'inventory' ? 'bg-grecia-accent text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                <i className="fas fa-boxes mr-2"></i> Inventario
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`px-4 lg:px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${activeTab === 'orders' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                <i className="fas fa-shopping-bag mr-2"></i> Pedidos
                            </button>
                            <button
                                onClick={() => setActiveTab('customers')}
                                className={`px-4 lg:px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${activeTab === 'customers' ? 'bg-[#FFC107] text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                <i className="fas fa-users mr-2"></i> Clientes
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-4 lg:px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                <i className="fas fa-chart-line mr-2"></i> Inteligencia
                            </button>
                            <button
                                onClick={() => setActiveTab('discounts')}
                                className={`px-4 lg:px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 whitespace-nowrap ${activeTab === 'discounts' ? 'bg-[#ff69b4] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                <i className="fas fa-tag mr-2"></i> Promociones
                            </button>
                        </div>
                    </div>
                </header>

                {activeTab === 'inventory' ? (
                    <InventoryManagement />
                ) : activeTab === 'customers' ? (
                    <CustomersDashboard />
                ) : activeTab === 'orders' ? (
                    <OrdersDashboard />
                ) : activeTab === 'discounts' ? (
                    <DiscountsDashboard />
                ) : (
                    <AnalyticsDashboard products={products} />
                )}

            </div>
        </main>
    );
}
