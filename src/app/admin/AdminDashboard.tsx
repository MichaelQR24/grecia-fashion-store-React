"use client";

import { useState } from "react";
import { useAppContext, Product } from "@/context/AppContext";
import LogoutButton from "@/components/ui/LogoutButton";

export default function AdminDashboard() {
    const { products, addProduct, updateProduct, deleteProduct } = useAppContext();

    // Formulario de Nueva Prenda
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Control");
    const [stock, setStock] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Precargar datos para Edición
    const handleEditClick = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setPrice(String(product.price));
        setCategory(product.category);
        setStock(String(product.stock));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Botón de Cancelar Edición
    const handleCancelEdit = () => {
        setEditingId(null);
        setName(""); setPrice(""); setStock(""); setImageFile(null);
        setIsSuccess(false);
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

        if (editingId) {
            success = await updateProduct(editingId, {
                name,
                price: Number(price),
                category,
                stock: Number(stock),
                image: finalImageUrl
            });
        } else {
            success = await addProduct({
                name,
                price: Number(price),
                category,
                stock: Number(stock),
                image: finalImageUrl
            });
        }

        if (success) {
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);

            // Si estábamos editando, salimos de modo edición tras éxito
            if (editingId) setEditingId(null);

            // Reset Form fields
            setName(""); setPrice(""); setStock(""); setImageFile(null);

            // Reset file input UI manually
            const fileInput = document.getElementById("image-upload-input") as HTMLInputElement;
            if (fileInput) fileInput.value = "";
        } else {
            alert("No tienes permisos de escritura en la Base de Datos o hubo un error.");
        }
        setIsUploading(false);
    };

    return (
        <main className="min-h-screen bg-[#050505] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-6xl">

                <header className="mb-12 border-b border-gray-900 pb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-white mb-2">
                            <i className="fas fa-shield-alt text-grecia-accent mr-3"></i>
                            Portal Administrativo Seguro
                        </h1>
                        <p className="text-sm text-gray-500">Gestión de Inventario Permanente (JSON Database + JWT)</p>
                    </div>
                    <div className="hidden md:block w-48">
                        <LogoutButton />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* PANEL IZQUIERDO: AGREGAR / EDITAR PRODUCTO */}
                    <div className="lg:col-span-1 bg-[#111] border border-gray-800 rounded-lg p-6 h-fit sticky top-32 transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-serif font-bold text-white flex items-center">
                                {editingId ? (
                                    <><i className="fas fa-edit text-orange-400 mr-2"></i> Editando Producto</>
                                ) : (
                                    <><i className="fas fa-plus-circle text-grecia-accent mr-2"></i> Nuevo Producto</>
                                )}
                            </h2>
                            {editingId && (
                                <button onClick={handleCancelEdit} type="button" className="text-gray-400 hover:text-white text-sm underline">
                                    Cancelar
                                </button>
                            )}
                        </div>

                        {isSuccess && (
                            <div className="mb-6 bg-green-900/40 border border-green-800 text-green-400 p-4 rounded text-sm flex items-center">
                                <i className="fas fa-check-circle mr-2 text-lg"></i> {editingId ? 'Cambios guardados' : 'Producto guardado en la BD'}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-black border border-gray-800 text-white px-3 py-2 rounded text-sm focus:border-grecia-accent outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Precio ($)</label>
                                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} required step="0.01" className="w-full bg-black border border-gray-800 text-white px-3 py-2 rounded text-sm focus:border-grecia-accent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Stock</label>
                                    <input type="number" value={stock} onChange={e => setStock(e.target.value)} required className="w-full bg-black border border-gray-800 text-white px-3 py-2 rounded text-sm focus:border-grecia-accent outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Categoría</label>
                                <input
                                    type="text"
                                    list="category-options"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                    placeholder="Escribe o selecciona una categoría"
                                    className="w-full bg-black border border-gray-800 text-white px-3 py-2 rounded text-sm focus:border-grecia-accent outline-none"
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
                                <label className="block text-xs text-gray-400 mb-1">
                                    {editingId ? "Actualizar Imagen (Opcional)" : "Imagen del Producto (Local)"}
                                </label>
                                <input
                                    id="image-upload-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full bg-black border border-gray-800 text-gray-400 px-3 py-2 rounded text-sm focus:border-grecia-accent outline-none file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:bg-gray-800 file:text-white hover:file:bg-grecia-accent transition cursor-pointer"
                                />
                            </div>
                            <button disabled={isUploading} type="submit" className={`w-full text-white py-3 rounded font-bold text-sm tracking-wider transition uppercase mt-4 disabled:opacity-50 disabled:cursor-not-allowed ${editingId ? 'bg-orange-500 hover:bg-orange-400' : 'bg-grecia-accent hover:bg-white hover:text-black'}`}>
                                {isUploading ? 'Procesando...' : (editingId ? 'Actualizar Producto' : 'Guardar en Base de Datos')}
                            </button>
                        </form>
                    </div>

                    {/* PANEL DERECHO: VISTA EN VIVO DE BASE DE DATOS */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-serif font-bold text-white"><i className="fas fa-database text-gray-500 mr-2"></i> Catálogo Persistente</h2>
                            <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full">{products.length} Referencias</span>
                        </div>

                        {products.length === 0 ? (
                            <p className="text-gray-500 text-sm">La base de datos está vacía.</p>
                        ) : (
                            <div className="bg-[#111] border border-gray-900 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#1a1a1a] text-gray-300 text-xs uppercase">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Producto</th>
                                            <th className="px-4 py-3 font-medium">Categoría</th>
                                            <th className="px-4 py-3 font-medium">Precio</th>
                                            <th className="px-4 py-3 font-medium">Stock</th>
                                            <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {products.map(prod => (
                                            <tr key={prod.id} className="hover:bg-white/5 transition">
                                                <td className="px-4 py-4 flex items-center gap-3">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={prod.image} alt="thumb" className="w-10 h-10 rounded object-cover border border-gray-800" />
                                                    <span className="text-gray-200 font-medium">{prod.name}</span>
                                                </td>
                                                <td className="px-4 py-4">{prod.category}</td>
                                                <td className="px-4 py-4 font-bold text-white">${prod.price}</td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${prod.stock > 0 ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                                        {prod.stock} UND
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <button onClick={() => handleEditClick(prod)} className="text-gray-400 hover:text-orange-400 transition mr-4" title="Editar Prenda">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(prod.id, prod.name)} className="text-gray-400 hover:text-red-500 transition" title="Borrar Permanente">
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </main>
    );
}
