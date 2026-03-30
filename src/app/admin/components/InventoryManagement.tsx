"use client";

import { useState } from "react";
import { Product } from "@/types";
import { useProductStore } from "@/store/useProductStore";
import Image from "next/image";
import toast from "react-hot-toast";

export default function InventoryManagement() {
    const { products, addProduct, updateProduct, deleteProduct } = useProductStore();

    // Colores base para la boutique y estado para los dinámicos
    const [availableColors, setAvailableColors] = useState([
        { id: 'negro', hex: '#111111', label: 'Negro Ébano' },
        { id: 'blanco', hex: '#F3F4F6', label: 'Blanco Nieve' },
        { id: 'beige', hex: '#D2B48C', label: 'Beige Piel' },
        { id: 'moka', hex: '#5c4033', label: 'Marrón Moka' },
        { id: 'rojo', hex: '#8B0000', label: 'Rojo Vino' },
    ]);
    const [customColorHex, setCustomColorHex] = useState("#DDA7A5"); // Rose Gold por defecto

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
                    toast.error(`Error Nube: ${data.message || "Fallo desconocido"}`);
                }
            } catch (error) {
                console.error("Upload error", error);
                toast.error("Error de red conectando con la API de subida.");
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
            toast.error("No tienes permisos de escritura en la Base de Datos o hubo un error.");
        }
        setIsUploading(false);
    };

    return (
        <>
            {/* LOW STOCK ALERT */}
            {products.filter(p => p.stock > 0 && p.stock <= 5).length > 0 && (
                <div className="mb-8 bg-red-950/40 border border-red-500/30 rounded-xl p-4 flex items-center gap-4 text-red-200 animate-fade-in-up shadow-lg">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm tracking-wide text-red-400">¡Alerta de Stock Bajo!</h4>
                        <p className="text-xs opacity-90 mt-0.5">
                            Tienes {products.filter(p => p.stock > 0 && p.stock <= 5).length} producto(s) a punto de agotarse. Por favor verifica el panel y contacta a tu proveedor.
                        </p>
                    </div>
                </div>
            )}

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
        </>
    );
}
