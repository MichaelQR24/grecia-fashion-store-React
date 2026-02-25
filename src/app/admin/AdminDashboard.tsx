"use client";

import { useState } from "react";
import { useAppContext, Product } from "@/context/AppContext";
import LogoutButton from "@/components/ui/LogoutButton";

export default function AdminDashboard() {
    const { products, addProduct, updateProduct, deleteProduct } = useAppContext();

    // Colores base para la boutique
    const AVAILABLE_COLORS = [
        { id: 'negro', hex: '#111111', label: 'Negro Ébano' },
        { id: 'blanco', hex: '#F3F4F6', label: 'Blanco Nieve' },
        { id: 'beige', hex: '#D2B48C', label: 'Beige Piel' },
        { id: 'moka', hex: '#5c4033', label: 'Marrón Moka' },
        { id: 'rojo', hex: '#8B0000', label: 'Rojo Vino' },
    ];

    // Formulario de Nueva Prenda
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Control");
    const [stock, setStock] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
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
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Botón de Cancelar Edición
    const handleCancelEdit = () => {
        setEditingId(null);
        setName(""); setPrice(""); setStock(""); setImageFile(null); setSelectedColors([]);
        setIsSuccess(false);
    };

    const toggleColor = (hex: string) => {
        setSelectedColors(prev =>
            prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]
        );
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
            colors: selectedColors
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
                <header className="mb-12 border-b border-gray-800/50 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                    <div className="w-full md:w-auto">
                        <LogoutButton />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
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
                                    <div className="flex flex-wrap gap-3">
                                        {AVAILABLE_COLORS.map(color => (
                                            <button
                                                key={color.id}
                                                type="button"
                                                onClick={() => toggleColor(color.hex)}
                                                className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${selectedColors.includes(color.hex) ? 'border-grecia-accent scale-110 shadow-lg' : 'border-gray-700 opacity-60 hover:opacity-100 hover:scale-105'}`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.label}
                                            >
                                                {selectedColors.includes(color.hex) && <i className={`fas fa-check text-[10px] ${color.hex === '#F3F4F6' ? 'text-black' : 'text-white'}`}></i>}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-2">Puedes seleccionar múltiples colores presionándolos.</p>
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
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-[#111] text-gray-500 text-[10px] uppercase tracking-widest border-b border-gray-800/80">
                                            <tr>
                                                <th className="px-6 py-5 font-bold">Prenda</th>
                                                <th className="px-6 py-5 font-bold">Categoría</th>
                                                <th className="px-6 py-5 font-bold">Precio</th>
                                                <th className="px-6 py-5 font-bold">Estado (Stock)</th>
                                                <th className="px-6 py-5 font-bold text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800/50 text-gray-300">
                                            {products.map(prod => {
                                                const isLowStock = prod.stock > 0 && prod.stock <= 5;
                                                const isOutOfStock = prod.stock <= 0;

                                                return (
                                                    <tr key={prod.id} className="hover:bg-[#111]/80 transition group">
                                                        <td className="px-6 py-5 flex items-center gap-4">
                                                            <div className="relative h-14 w-10 overflow-hidden bg-black flex-shrink-0 border border-gray-800 group-hover:border-gray-600 transition">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={prod.image} alt="thumb" className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-40' : ''}`} />
                                                            </div>
                                                            <span className={`font-serif tracking-wide text-sm ${isOutOfStock ? 'text-gray-600 line-through' : 'text-gray-100'}`}>
                                                                {prod.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="text-[10px] uppercase tracking-wider text-gray-500">{prod.category}</span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className={`font-serif italic ${isOutOfStock ? 'text-gray-600' : 'text-grecia-accent'}`}>${prod.price}</span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            {isOutOfStock ? (
                                                                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-red-500/80">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/80"></div> Agotado
                                                                </span>
                                                            ) : isLowStock ? (
                                                                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#FFC107]">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFC107]"></div> ÚLTIMAS {prod.stock}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-green-500/80">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/80"></div> {prod.stock} DISP.
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-5 text-right space-x-4">
                                                            <button onClick={() => handleEditClick(prod)} className="text-gray-600 hover:text-[#FFC107] transition text-sm" title="Editar Prenda">
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(prod.id, prod.name)} className="text-gray-600 hover:text-red-500 transition text-sm" title="Eliminar Definitivamente">
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

            </div>
        </main>
    );
}
