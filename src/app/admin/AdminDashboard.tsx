"use client";

import { useState } from "react";
import { useAppContext, Product } from "@/context/AppContext";
import LogoutButton from "@/components/ui/LogoutButton";
import Image from "next/image";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) {
        alert("No hay datos para exportar.");
        return;
    }
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => {
        return Object.values(row).map(value => {
            const escaped = ('' + (value ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(',');
    });
    const csvContent = ["\ufeff" + headers, ...csvRows].join('\n'); // \ufeff for utf8 bom (excel compat)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export default function AdminDashboard() {
    const { products, addProduct, updateProduct, deleteProduct } = useAppContext();

    // Colores base para la boutique y estado para los dinámicos
    const [availableColors, setAvailableColors] = useState([
        { id: 'negro', hex: '#111111', label: 'Negro Ébano' },
        { id: 'blanco', hex: '#F3F4F6', label: 'Blanco Nieve' },
        { id: 'beige', hex: '#D2B48C', label: 'Beige Piel' },
        { id: 'moka', hex: '#5c4033', label: 'Marrón Moka' },
        { id: 'rojo', hex: '#8B0000', label: 'Rojo Vino' },
    ]);
    const [customColorHex, setCustomColorHex] = useState("#DDA7A5"); // Rose Gold por defecto

    // Pestañas (Tabs)
    const [activeTab, setActiveTab] = useState<'inventory' | 'analytics' | 'customers' | 'orders' | 'discounts'>('inventory');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Control");
    const [stock, setStock] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);

    // Banderas / Colecciones
    const [isOffer, setIsOffer] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [isBestseller, setIsBestseller] = useState(false);

    const [isSuccess, setIsSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Precargar datos para Edición
    const handleEditClick = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setPrice(String(product.price));
        setCategory(product.category);
        setStock(String(product.stock));
        setSelectedColors(product.colors || []);
        setIsOffer(product.is_offer || false);
        setIsNew(product.is_new || false);
        setIsBestseller(product.is_bestseller || false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName(""); setPrice(""); setStock(""); setImageFile(null); setSelectedColors([]);
        setIsOffer(false); setIsNew(false); setIsBestseller(false);
        setIsSuccess(false);
    };

    const toggleColor = (hex: string) => {
        setSelectedColors(prev =>
            prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]
        );
    };

    const handleAddCustomColor = () => {
        const hex = customColorHex.toUpperCase();
        const alreadyExists = availableColors.find(c => c.hex.toUpperCase() === hex);
        if (!alreadyExists) {
            const newColor = { id: `custom-${Date.now()}`, hex: hex, label: 'Color Personalizado' };
            setAvailableColors([...availableColors, newColor]);
        }
        if (!selectedColors.includes(hex) && !selectedColors.includes(customColorHex.toLowerCase())) {
            setSelectedColors([...selectedColors, hex]);
        }
    };

    const handleDeleteColor = (idToRemove: string, hexToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAvailableColors(prev => prev.filter(c => c.id !== idToRemove));
        setSelectedColors(prev => prev.filter(c => c !== hexToRemove));
    };

    // Borrado Directo
    const handleDeleteClick = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro que deseas eliminar permanentemente: ${name}?`)) {
            await deleteProduct(id);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        let finalImageUrl = "https://images.unsplash.com/photo-1550639525-c97d455acf70?ixlib=rb-4.0.3&w=687&q=80";

        if (imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    finalImageUrl = data.imageUrl;
                } else {
                    alert(`Error Nube: ${data.message || "Fallo desconocido"}`);
                }
            } catch (error) {
                console.error("Upload error", error);
                alert("Error de red conectando con la API de subida.");
            }
        } else if (editingId) {
            // Si estamos editando y no subimos foto nueva, conservar la foto vieja
            const oldProduct = products.find(p => p.id === editingId);
            if (oldProduct) finalImageUrl = oldProduct.image;
        }

        let success = false;

        const productPayload = {
            name,
            price: Number(price),
            category,
            stock: Number(stock),
            image: finalImageUrl,
            colors: selectedColors,
            is_offer: isOffer,
            is_new: isNew,
            is_bestseller: isBestseller
        };

        if (editingId) {
            success = await updateProduct(editingId, productPayload);
        } else {
            success = await addProduct(productPayload);
        }

        if (success) {
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);

            // Si estábamos editando, salimos de modo edición tras éxito
            if (editingId) setEditingId(null);

            // Reset Form fields
            setName(""); setPrice(""); setStock(""); setImageFile(null); setSelectedColors([]);
            setIsOffer(false); setIsNew(false); setIsBestseller(false);

            // Reset file input UI manually
            const fileInput = document.getElementById("image-upload-input") as HTMLInputElement;
            if (fileInput) fileInput.value = "";
        } else {
            alert("No tienes permisos de escritura en la Base de Datos o hubo un error.");
        }
        setIsUploading(false);
    };

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

                {/* LOW STOCK ALERT */}
                {products.filter(p => p.stock > 0 && p.stock <= 5).length > 0 && (
                    <div className="mb-8 bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-center gap-4 text-red-200 animate-fade-in-up shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm tracking-wide text-red-400">¡Alerta de Stock Bajo!</h4>
                            <p className="text-xs opacity-90 mt-0.5">
                                Tienes {products.filter(p => p.stock > 0 && p.stock <= 5).length} producto(s) a punto de agotarse. Por favor verifica el panel de inventario y contacta a tu proveedor.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-fade-in-up">
                        {/* PANEL IZQUIERDO: FORMULARIO */}
                        <div className="lg:col-span-4 lg:sticky top-32 h-fit">
                            <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800/60 rounded-xl p-8 shadow-2xl transition-all animate-fade-in-up">
                                <div className="flex justify-between items-center mb-8 border-b border-gray-800/50 pb-4">
                                    <h2 className="text-xl font-serif text-white tracking-wide flex items-center gap-2">
                                        {editingId ? (
                                            <><i className="fas fa-pen-nib text-[#FFC107] text-sm"></i> Editar Prenda</>
                                        ) : (
                                            <><i className="fas fa-plus text-grecia-accent text-sm"></i> Nueva Prenda</>
                                        )}
                                    </h2>
                                    {editingId && (
                                        <button onClick={handleCancelEdit} type="button" className="text-gray-500 hover:text-white text-xs uppercase tracking-widest transition">
                                            Cancelar
                                        </button>
                                    )}
                                </div>

                                {isSuccess && (
                                    <div className="mb-8 bg-green-950/20 border-l-2 border-green-500/50 text-green-400/90 p-4 text-xs tracking-wider flex items-center animate-fade-in-up">
                                        <i className="fas fa-check mr-3"></i>
                                        {editingId ? 'Prenda actualizada con éxito' : 'Nueva prenda añadida a la colección'}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Nombre de la Prenda</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                            className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 text-sm focus:border-grecia-accent/50 focus:bg-[#151515] outline-none transition placeholder-gray-700"
                                            placeholder="Ej. Jean Push Up Magia" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Precio USD</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} required step="0.01"
                                                    className="w-full bg-[#111] border border-gray-800 text-white pl-8 pr-3 py-3 text-sm focus:border-grecia-accent/50 focus:bg-[#151515] outline-none transition"
                                                    placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Unidades (Stock)</label>
                                            <input type="number" value={stock} onChange={e => setStock(e.target.value)} required
                                                className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 text-sm focus:border-grecia-accent/50 focus:bg-[#151515] outline-none transition"
                                                placeholder="10" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Color(es) Disponible(s)</label>
                                        <div className="flex flex-wrap items-center gap-4">
                                            {availableColors.map(color => (
                                                <div key={color.id} className="relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleColor(color.hex)}
                                                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center shadow-lg ${selectedColors.includes(color.hex) ? 'border-grecia-accent scale-110 shadow-grecia-accent/30' : 'border-gray-700 opacity-80 hover:opacity-100 hover:scale-105'}`}
                                                        style={{ backgroundColor: color.hex }}
                                                        title={color.label}
                                                    >
                                                        {selectedColors.includes(color.hex) && <i className={`fas fa-check text-[10px] drop-shadow-md ${color.hex.toUpperCase() === '#FFFFFF' || color.hex.toUpperCase() === '#F3F4F6' ? 'text-black' : 'text-white'}`}></i>}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteColor(color.id, color.hex, e)}
                                                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 hover:bg-red-600 shadow-md transition-all scale-75 group-hover:scale-100 z-10"
                                                        title="Eliminar Color de la Paleta"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Dinámicamente añadir color libre */}
                                            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-800">
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-600 hover:border-grecia-accent transition group cursor-pointer flex-shrink-0 shadow-lg" title="Elegir nuevo color">
                                                    <input
                                                        type="color"
                                                        value={customColorHex}
                                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomColor}
                                                    className="bg-[#111] hover:bg-grecia-accent text-gray-400 hover:text-white px-3 py-1.5 rounded-full flex items-center justify-center transition-all text-[10px] uppercase font-bold tracking-wider border border-gray-800 hover:border-transparent min-w-[max-content]"
                                                >
                                                    <i className="fas fa-plus mr-1"></i> Añadir
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-gray-500 mt-3 font-light flex items-center gap-1.5">
                                            <i className="fas fa-info-circle text-gray-600"></i> Selecciona uno existente, o inventa el tuyo usando la gota tricolor.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">Colección / Categoría</label>
                                        <input
                                            type="text" list="category-options" value={category} onChange={e => setCategory(e.target.value)} required
                                            className="w-full bg-[#111] border border-gray-800 text-white px-4 py-3 text-sm focus:border-grecia-accent/50 focus:bg-[#151515] outline-none transition placeholder-gray-700"
                                            placeholder="Selecciona o escribe..."
                                        />
                                        <datalist id="category-options">
                                            <option value="Jeans Levanta Cola" />
                                            <option value="Control y Moldeo" />
                                            <option value="Bodys Reductores" />
                                            <option value="Conjuntos Deportivos" />
                                            <option value="Vestidos" />
                                        </datalist>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-3">Distintivos Especiales (Banners)</label>
                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-10 h-5 rounded-full transition-colors relative ${isNew ? 'bg-grecia-accent' : 'bg-gray-800'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isNew ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                                </div>
                                                <input type="checkbox" className="hidden" checked={isNew} onChange={() => setIsNew(!isNew)} />
                                                <span className="text-xs text-gray-300 group-hover:text-white transition">🌟 Marcar como <strong>&quot;Novedad&quot;</strong> (Recién Llegado)</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-10 h-5 rounded-full transition-colors relative ${isBestseller ? 'bg-[#FFC107]' : 'bg-gray-800'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isBestseller ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                                </div>
                                                <input type="checkbox" className="hidden" checked={isBestseller} onChange={() => setIsBestseller(!isBestseller)} />
                                                <span className="text-xs text-gray-300 group-hover:text-white transition">🔥 Marcar como <strong>&quot;Best Seller&quot;</strong> (Más Vendido)</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-10 h-5 rounded-full transition-colors relative ${isOffer ? 'bg-red-500' : 'bg-gray-800'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${isOffer ? 'translate-x-5' : 'translate-x-1'}`}></div>
                                                </div>
                                                <input type="checkbox" className="hidden" checked={isOffer} onChange={() => setIsOffer(!isOffer)} />
                                                <span className="text-xs text-gray-300 group-hover:text-white transition">🏷️ Marcar en <strong>&quot;Oferta Especial&quot;</strong></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-2">
                                            {editingId ? "Actualizar Fotografía" : "Fotografía Editorial (Local)"}
                                        </label>
                                        <div className="relative group">
                                            <input
                                                id="image-upload-input" type="file" accept="image/*"
                                                onChange={e => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setImageFile(e.target.files[0]);
                                                    }
                                                }}
                                                className="w-full bg-[#111] border border-gray-800 text-gray-400 px-3 py-3 text-sm focus:border-grecia-accent outline-none
                                            file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-[10px] file:font-bold file:tracking-widest file:uppercase file:bg-gray-800 file:text-white
                                            hover:file:bg-white hover:file:text-black hover:border-gray-600 transition cursor-pointer"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-2 font-light">Se optimizará y subirá a Supabase Storage automáticamente.</p>
                                    </div>

                                    <button disabled={isUploading} type="submit"
                                        className={`w-full text-black py-4 font-bold text-[10px] tracking-[0.2em] transition-all uppercase shadow-[0_5px_15px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed
                                    ${editingId
                                                ? 'bg-[#FFC107] hover:bg-[#ffcd38] border border-transparent'
                                                : 'bg-white hover:bg-gray-200 border border-transparent'}`}>
                                        {isUploading
                                            ? <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i> Cargando Alta Costura...</span>
                                            : (editingId ? 'Guardar Cambios' : 'Anexar a Colección')}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* PANEL DERECHO: CATÁLOGO */}
                        <div className="lg:col-span-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-end justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-serif font-light text-white tracking-wide">Inventario <span className="italic text-gray-400">Activo</span></h2>
                                </div>
                                <div className="bg-[#111] border border-gray-800 text-[10px] tracking-widest text-grecia-accent uppercase px-4 py-2">
                                    {products.length} Referencias listadas
                                </div>
                            </div>

                            {products.length === 0 ? (
                                <div className="bg-[#0a0a0a]/50 border border-gray-800/50 rounded-xl p-12 text-center">
                                    <i className="fas fa-hanger text-4xl text-gray-800 mb-4"></i>
                                    <p className="text-gray-500 font-light text-sm">Tu boutique está vacía. Añade tu primera prenda.</p>
                                </div>
                            ) : (
                                <div className="bg-[#0a0a0a] border border-gray-800/50 rounded-xl overflow-hidden shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-[#111] text-gray-500 text-[9px] uppercase tracking-widest border-b border-gray-800/80">
                                                <tr>
                                                    <th className="px-3 py-4 font-bold">Prenda</th>
                                                    <th className="px-3 py-4 font-bold">Categoría</th>
                                                    <th className="px-3 py-4 font-bold">Precio</th>
                                                    <th className="px-3 py-4 font-bold">Stock</th>
                                                    <th className="px-3 py-4 font-bold text-center">Badges</th>
                                                    <th className="px-3 py-4 font-bold text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/50 text-gray-300">
                                                {products.map(prod => {
                                                    const isLowStock = prod.stock > 0 && prod.stock <= 5;
                                                    const isOutOfStock = prod.stock <= 0;

                                                    return (
                                                        <tr key={prod.id} className="hover:bg-[#111]/80 transition group text-[11px]">
                                                            <td className="px-3 py-3 flex items-center gap-3">
                                                                <div className="relative h-10 w-8 overflow-hidden bg-black flex-shrink-0 border border-gray-800 group-hover:border-gray-600 transition rounded-sm">
                                                                    <Image src={prod.image} alt="thumb" width={40} height={40} className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-40' : ''}`} />
                                                                </div>
                                                                <span className={`font-serif tracking-wide truncate max-w-[120px] lg:max-w-[150px] xl:max-w-[200px] ${isOutOfStock ? 'text-gray-600 line-through' : 'text-gray-100'}`} title={prod.name}>
                                                                    {prod.name}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className="text-[9px] uppercase tracking-wider text-gray-500 truncate max-w-[80px] block" title={prod.category}>{prod.category}</span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className={`font-serif italic ${isOutOfStock ? 'text-gray-600' : 'text-grecia-accent'}`}>${prod.price}</span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                {isOutOfStock ? (
                                                                    <span className="flex items-center gap-2 text-[10px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-md w-fit" title="Agotado">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/80"></div> Agotado
                                                                    </span>
                                                                ) : isLowStock ? (
                                                                    <span className="flex items-center gap-2 text-[10px] font-bold text-[#FFC107] bg-[#FFC107]/10 px-2.5 py-1.5 rounded-md w-fit" title="Últimas unidades">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FFC107] animate-pulse"></div> Por Agotar ({prod.stock})
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-md w-fit">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/80"></div> En Stock ({prod.stock})
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-3 text-center">
                                                                <div className="flex justify-center gap-1">
                                                                    {prod.is_new && <span title="Novedad" className="w-5 h-5 rounded-full bg-grecia-accent/20 text-grecia-accent flex items-center justify-center text-[9px]"><i className="fas fa-star"></i></span>}
                                                                    {prod.is_bestseller && <span title="Más Vendido" className="w-5 h-5 rounded-full bg-[#FFC107]/20 text-[#FFC107] flex items-center justify-center text-[9px]"><i className="fas fa-fire"></i></span>}
                                                                    {prod.is_offer && <span title="En Oferta" className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-[9px]"><i className="fas fa-tag"></i></span>}
                                                                    {!prod.is_new && !prod.is_bestseller && !prod.is_offer && <span className="text-gray-700 text-xs">-</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-3 text-right space-x-3">
                                                                <button onClick={() => handleEditClick(prod)} className="text-gray-600 hover:text-[#FFC107] transition text-[13px]" title="Editar Prenda">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button onClick={() => handleDeleteClick(prod.id, prod.name)} className="text-gray-600 hover:text-red-500 transition text-[13px]" title="Eliminar Definitivamente">
                                                                    <i className="fas fa-trash-alt"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'customers' ? (
                    <CustomersDashboard />
                ) : activeTab === 'orders' ? (
                    <OrdersDashboard />
                ) : activeTab === 'discounts' ? (
                    <DiscountsDashboard />
                ) : (
                    <AnalyticsDashboard products={products} />
                )
                }

            </div >
        </main >
    );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTE: DASHBOARD ANALÍTICO LIGERO E INTUITIVO PARA EL CLIENTE
// ----------------------------------------------------------------------
function AnalyticsDashboard({ products }: { products: Product[] }) {
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

// ----------------------------------------------------------------------
// SUB-COMPONENTE: CRM DE CLIENTES REGISTRADOS
// ----------------------------------------------------------------------
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

function CustomersDashboard() {
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

// ----------------------------------------------------------------------
// SUB-COMPONENTE: GESTIÓN DE PEDIDOS Y ESTADOS
// ----------------------------------------------------------------------
function OrdersDashboard() {
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
                            Cliente: o.profiles?.full_name || 'Desconocido',
                            Email: o.profiles?.email || '',
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
                        const discountInfo = order.items?.find((item: any) => item.isMetadata && item.type === 'discount_info');
                        const realItems = order.items?.filter((item: any) => !item.isMetadata) || [];

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
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {realItems.map((item: any, idx: number) => (
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

function DiscountsDashboard() {
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
            alert("No puedes activar un cupón que ya alcanzó su límite de usos. Aumenta el límite o crea uno nuevo.");
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
                alert("Error al cambiar el estado del cupón.");
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
                    alert("Error invalidando el cupón.");
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
                    alert("Error al eliminar.");
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
            } else {
                alert(`Error al crear en Stripe: ${data.error}`);
            }

        } catch (error) {
            console.error(error);
            alert("Error de red al crear el cupón.");
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
                            <button type="submit" className="w-full bg-[#ff69b4] hover:bg-[#e0509a] text-white font-bold p-2 text-xs rounded transition uppercase">
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
