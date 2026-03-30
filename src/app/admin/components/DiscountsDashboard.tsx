"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

// ----------------------------------------------------------------------
// SUB-COMPONENTE: GESTIÓN DE CÓDIGOS DE DESCUENTO (PROMOCIONES)
// ----------------------------------------------------------------------
type Coupon = {
    id: string;
    code: string;
    discountText: string;
    description: string;
    isActive: boolean;
    maxUses: number;
    uses: number;
    expiresAt?: string | null;  // Fecha de fin en formato ISO
};

export default function DiscountsDashboard() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newDiscount, setNewDiscount] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newMax, setNewMax] = useState('50');
    const [durationDays, setDurationDays] = useState('0'); // 0 = sin limite de tiempo

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/coupons');
            const data = await res.json();
            if (res.ok) {
                setCoupons(data);
            } else {
                console.error("Error fetching coupons:", data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const toggleActive = async (id: string, currentUses: number, maxUses: number, currentActive: boolean) => {
        if (!currentActive && currentUses >= maxUses) {
            toast.error("No puedes activar un cupón que ya alcanzó su límite de usos. Aumenta el límite o crea uno nuevo.");
            return;
        }

        // Optimistic UI update
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentActive } : c));

        try {
            const res = await fetch('/api/coupons', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, active: !currentActive })
            });
            if (!res.ok) {
                // Revert on failure
                setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: currentActive } : c));
                toast.error("Error al cambiar el estado del cupón.");
            }
        } catch (error) {
            console.error(error);
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: currentActive } : c));
        }
    };

    const invalidateCoupon = async (id: string) => {
        if (confirm("¿Invalidar este cupón de inmediato? Nadie más podrá usarlo en Stripe.")) {
            // Optimistic UI update
            const originalCoupons = [...coupons];
            setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c));

            try {
                const res = await fetch('/api/coupons', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, active: false })
                });
                if (!res.ok) {
                    setCoupons(originalCoupons);
                    toast.error("Error invalidando el cupón.");
                }
            } catch (error) {
                setCoupons(originalCoupons);
                console.error(error);
            }
        }
    };

    const deleteCoupon = async (id: string) => {
        if (confirm("¿Eliminar (desactivar permanentemente) este cupón en Stripe?")) {
            const originalCoupons = [...coupons];
            setCoupons(prev => prev.filter(c => c.id !== id));
            try {
                const res = await fetch(`/api/coupons?id=${id}`, { method: 'DELETE' });
                if (!res.ok) {
                    setCoupons(originalCoupons);
                    toast.error("Error al eliminar.");
                }
            } catch (e) {
                console.error(e);
                setCoupons(originalCoupons);
            }
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        let expiryDate = null;
        const daysToNumber = parseInt(durationDays);
        if (daysToNumber > 0) {
            const date = new Date();
            date.setDate(date.getDate() + daysToNumber);
            expiryDate = date.toISOString();
        }

        // Bloquear UI
        const btn = document.getElementById('saveCouponBtn') as HTMLButtonElement;
        if (btn) { btn.disabled = true; btn.innerText = 'Guardando en Stripe...'; }

        try {
            const res = await fetch('/api/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: newCode.toUpperCase(),
                    discountText: newDiscount,
                    description: newDesc,
                    maxUses: newMax,
                    expiryDate: expiryDate
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                // Fetch the updated list to get complete data from stripe
                await fetchCoupons();
                setShowForm(false);
                setNewCode(''); setNewDiscount(''); setNewDesc(''); setNewMax('50'); setDurationDays('0');
                toast.success("Promoción creada exitosamente en Stripe.");
            } else {
                toast.error(`Error al crear en Stripe: ${data.error}`);
            }

        } catch (error) {
            console.error(error);
            toast.error("Error de red al crear el cupón.");
        } finally {
            if (btn) { btn.disabled = false; btn.innerText = 'Guardar Promoción'; }
        }
    };

    return (
        <div className="bg-[#0a0a0a] border border-gray-800/80 p-8 rounded-3xl shadow-2xl animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800/50 pb-6 gap-4">
                <div>
                    <h3 className="text-xl font-serif text-white flex items-center gap-3">
                        <i className="fas fa-ticket-alt text-[#ff69b4]"></i> Códigos de Descuento
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Crea y administra promociones (Simulación local interactiva)</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#ff69b4]/10 hover:bg-[#ff69b4]/20 text-[#ff69b4] border border-[#ff69b4]/30 px-5 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest transition shadow-lg">
                    <i className={showForm ? "fas fa-times" : "fas fa-plus"}></i> {showForm ? 'Cancelar' : 'Crear Nuevo Cupón'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="mb-8 p-6 bg-[#111] border border-[#ff69b4]/30 rounded-2xl animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">Código Promocional</label>
                            <input required type="text" placeholder="Ej: VERANO25" value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full bg-black border border-gray-800 text-white p-2 rounded text-xs focus:border-[#ff69b4] outline-none transition uppercase" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">Valor / Etiqueta</label>
                            <input required type="text" placeholder="Ej: 25% OFF / $10 Dcto" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} className="w-full bg-black border border-gray-800 text-white p-2 rounded text-xs focus:border-[#ff69b4] outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">Límite de Usos</label>
                            <input required type="number" placeholder="50" min="1" value={newMax} onChange={e => setNewMax(e.target.value)} className="w-full bg-black border border-gray-800 text-white p-2 rounded text-xs focus:border-[#ff69b4] outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">Duración Máxima</label>
                            <select value={durationDays} onChange={e => setDurationDays(e.target.value)} className="w-full bg-black border border-gray-800 text-white p-2 rounded text-xs focus:border-[#ff69b4] outline-none transition">
                                <option value="0">Sin límite de tiempo</option>
                                <option value="1">1 Día (24h)</option>
                                <option value="7">1 Semana</option>
                                <option value="15">15 Días (Quincena)</option>
                                <option value="30">1 Mes</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button type="submit" id="saveCouponBtn" className="w-full bg-[#ff69b4] hover:bg-[#e0509a] text-white font-bold p-2 text-xs rounded transition uppercase">
                                Guardar Promoción
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">Descripción Breve</label>
                        <input required type="text" placeholder="¿A qué aplica? Ej: Disponible en fajas y jeans" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full bg-black border border-gray-800 text-white p-2 rounded text-xs focus:border-[#ff69b4] outline-none transition" />
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {isLoading && (
                    <div className="col-span-full text-center py-10 opacity-50">
                        <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p className="text-xs uppercase tracking-widest text-[#ff69b4]">Sincronizando con Stripe...</p>
                    </div>
                )}
                {!isLoading && coupons.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        <p className="text-xs uppercase tracking-widest">No hay códigos promocionales (cupones) creados aún.</p>
                    </div>
                )}
                {!isLoading && coupons.map((coupon) => (
                    <div key={coupon.id} className={`bg-gradient-to-br from-[#111] to-[#0a0a0a] border ${coupon.isActive ? 'border-gray-800/80' : 'border-gray-800/40 opacity-70'} rounded-2xl p-6 relative overflow-hidden group transition-all`}>
                        <div className={`absolute top-0 right-0 w-16 h-16 ${coupon.isActive ? 'bg-green-500/10' : 'bg-gray-500/10'} rounded-bl-full -mr-4 -mt-4`}></div>

                        <div className="absolute top-4 right-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => invalidateCoupon(coupon.id)} className="w-6 h-6 rounded-full bg-[#ff69b4]/20 text-[#ff69b4] flex items-center justify-center text-[10px] hover:bg-[#ff69b4] hover:text-white transition" title="Invalidar inmediatamente (Forzar a 0 usos restantes)">
                                <i className="fas fa-ban"></i>
                            </button>
                            <button onClick={() => deleteCoupon(coupon.id)} className="w-6 h-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[10px] hover:bg-red-500 hover:text-white transition" title="Borrar Cupón Permanentemente">
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-black border border-gray-800 text-white font-mono text-xs px-3 py-1 rounded shadow-inner truncate mr-16">{coupon.code}</span>
                            <button onClick={() => toggleActive(coupon.id, coupon.uses, coupon.maxUses, coupon.isActive)} className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded cursor-pointer transition ${coupon.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`} title={coupon.isActive ? "Desactivar Promoción" : "Activar Promoción"}>
                                {coupon.isActive ? 'Activo' : 'Inactivo'}
                            </button>
                        </div>
                        <h4 className={`text-2xl font-serif mb-1 ${coupon.isActive ? 'text-white' : 'text-gray-500'}`}>{coupon.discountText}</h4>
                        <p className="text-xs text-gray-500 font-light mb-3 min-h-[32px]">{coupon.description}</p>

                        {coupon.expiresAt && (
                            <p className={`text-[10px] mb-2 font-bold ${new Date(coupon.expiresAt).getTime() < new Date().getTime() ? 'text-red-500' : 'text-orange-400'}`}>
                                <i className="far fa-clock mr-1"></i>
                                {new Date(coupon.expiresAt).getTime() < new Date().getTime()
                                    ? 'Vencido el ' + new Date(coupon.expiresAt).toLocaleDateString()
                                    : 'Válido hasta: ' + new Date(coupon.expiresAt).toLocaleString()
                                }
                            </p>
                        )}

                        <div className="w-full bg-gray-900 rounded-full h-1.5 mb-2 mt-2 overflow-hidden">
                            <div className={`${coupon.uses >= coupon.maxUses ? 'bg-red-500' : 'bg-green-500'} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min((coupon.uses / coupon.maxUses) * 100, 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-600 text-right uppercase font-bold">Usado {coupon.uses} / {coupon.maxUses}</p>
                    </div>
                ))}

                {/* Banner de Info */}
                <div className="bg-[#ff69b4]/5 border border-[#ff69b4]/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#ff69b4]/10 text-[#ff69b4] flex items-center justify-center text-xl mb-4">
                        <i className="fas fa-bullhorn"></i>
                    </div>
                    <h4 className="text-sm font-bold text-[#ff69b4] mb-2 uppercase tracking-wide">Impulsa tus ventas</h4>
                    <p className="text-xs text-gray-400">Interactúa con estas tarjetas. Este módulo CRUD guarda tu configuración localmente y permite encender o apagar promociones al vuelo.</p>
                </div>
            </div>
        </div>
    );
}
