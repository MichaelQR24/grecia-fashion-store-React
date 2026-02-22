"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";

interface AdminPanelProps {
    onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const { addProduct } = useAppContext();

    // Variables locales para el formulario
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Control");
    const [stock, setStock] = useState("");
    const [image, setImage] = useState("");

    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Agregar al contexto
        addProduct({
            name,
            price: Number(price),
            category,
            stock: Number(stock),
            image: image || "https://images.unsplash.com/photo-1550639525-c97d455acf70?ixlib=rb-4.0.3&w=687&q=80" // Imagen fallback
        });

        // Limpieza visual temporal de Feedback
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 popup-overlay">
            <div className="bg-grecia-card border border-gray-800 rounded-lg shadow-2xl max-w-lg w-full p-8 relative animate-slide-up overflow-y-auto max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10 transition">
                    <i className="fas fa-times text-xl"></i>
                </button>

                <div className="text-center mb-6">
                    <i className="fas fa-cogs text-4xl text-grecia-accent mb-3"></i>
                    <h3 className="font-serif text-2xl font-bold text-white">Añadir Nuevo Producto</h3>
                    <p className="text-xs text-gray-400 mt-1 pb-4 border-b border-gray-800">Panel de Control Gerencial</p>
                </div>

                {isSuccess ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                        <i className="fas fa-check-circle text-6xl text-green-500 mb-4 animate-pulse-slow"></i>
                        <h4 className="text-white font-bold text-xl">¡Producto Agregado!</h4>
                        <p className="text-gray-400 text-sm mt-2">El catálogo se ha actualizado en tiempo real.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Nombre del Producto</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Faja Cinturilla Deportiva" className="w-full bg-black border border-gray-800 text-white px-4 py-2.5 rounded text-sm focus:outline-none focus:border-grecia-accent transition" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Precio ($)</label>
                                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="1" step="0.01" placeholder="95.00" className="w-full bg-black border border-gray-800 text-white px-4 py-2.5 rounded text-sm focus:outline-none focus:border-grecia-accent transition" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Unidades (Stock)</label>
                                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min="0" placeholder="10" className="w-full bg-black border border-gray-800 text-white px-4 py-2.5 rounded text-sm focus:outline-none focus:border-grecia-accent transition" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Categoría</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black border border-gray-800 text-white px-4 py-2.5 rounded text-sm focus:outline-none focus:border-grecia-accent transition appearance-none">
                                <option value="Jeans Levanta Cola">Jeans Levanta Cola</option>
                                <option value="Control">Control y Moldeo</option>
                                <option value="Bodys">Bodys Reductores</option>
                                <option value="Deportivos">Conjuntos Deportivos</option>
                                <option value="Vestidos">Vestidos</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">URL de la Imagen (Opcional)</label>
                            <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://ejemplo.com/foto.jpg" className="w-full bg-black border border-gray-800 text-gray-300 px-4 py-2.5 rounded text-xs focus:outline-none focus:border-grecia-accent transition italic" />
                        </div>

                        <button type="submit" className="w-full bg-white text-black py-3 font-bold hover:bg-grecia-accent hover:text-white transition shadow-[0_0_15px_rgba(255,255,255,0.2)] uppercase tracking-wider text-sm rounded mt-6">
                            Publicar al Catálogo <i className="fas fa-arrow-right ml-1"></i>
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
