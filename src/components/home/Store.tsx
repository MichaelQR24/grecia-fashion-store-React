"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";

export default function Store() {
    const { products, addToCart } = useAppContext();
    const [activeCategory, setActiveCategory] = useState<string>("Ver Todo");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleAddToCart = (product: any) => {
        addToCart(product);
        // Opcional: Feedback visual rápido
    };

    // Extraer categorías únicas dinámicamente, más la de "Ver Todo"
    const categoriesSet = new Set(products.map(p => p.category));
    const categories = ["Ver Todo", ...Array.from(categoriesSet)];

    // Filtrar los productos para el render principal
    const filteredProducts = activeCategory === "Ver Todo"
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <section id="store" className="py-20 bg-[#050505] min-h-screen border-t border-gray-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <span className="text-grecia-accent text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase flex items-center justify-center gap-3 mb-3">
                        <span className="w-8 h-[1px] bg-grecia-accent/50"></span> Explorar Colecciones <span className="w-8 h-[1px] bg-grecia-accent/50"></span>
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-light mt-2 text-white tracking-wide">
                        Nuestro <span className="italic text-gray-400 font-medium">Catálogo</span>
                    </h2>
                </div>

                {/* Filtro de Categorías */}
                <div className="flex flex-wrap justify-center gap-2 mb-16 max-w-4xl mx-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 ${activeCategory === cat
                                ? 'bg-grecia-accent text-white font-bold shadow-[0_5px_15px_rgba(221,167,165,0.4)] tracking-[0.2em]'
                                : 'bg-[#111] text-gray-400 font-medium hover:bg-[#1a1a1a] hover:text-white border border-gray-800'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {filteredProducts.map((product) => {
                        const isOutOfStock = product.stock <= 0;

                        return (
                            <div key={product.id} className="group relative transition duration-[1.5s] animate-fade-in-up flex flex-col">
                                <div className="relative overflow-hidden mb-5 bg-[#0a0a0a] aspect-[3/4] rounded-[2rem] shadow-xl hover:shadow-[0_20px_40px_rgba(221,167,165,0.08)] transition-all duration-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.image} alt={product.name} className={`w-full h-full object-cover transition duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] ${isOutOfStock ? 'grayscale opacity-30' : 'group-hover:scale-105 opacity-90 group-hover:opacity-100'}`} />

                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-[#4a2e2d]/20 transition duration-700 z-10 pointer-events-none mix-blend-multiply"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-700 z-10 pointer-events-none"></div>

                                    {/* BADGES METADATA DATABASE */}
                                    {isOutOfStock ? (
                                        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center z-10 animate-pulse">
                                            <span className="bg-red-900/90 backdrop-blur-md text-red-100 px-6 py-2 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full border border-red-500/30 shadow-2xl">
                                                Agotado
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="absolute top-5 left-5 flex flex-col gap-2 z-20 items-start">
                                            {product.stock > 0 && product.stock <= 5 && (
                                                <div className="bg-grecia-accent/90 backdrop-blur-md text-white text-[9px] font-bold px-4 py-1.5 uppercase tracking-[0.2em] shadow-[0_5px_15px_rgba(221,167,165,0.4)] rounded-full">
                                                    ÚLTIMAS {product.stock}
                                                </div>
                                            )}
                                            {product.is_bestseller && (
                                                <div className="bg-[#DDA7A5]/90 backdrop-blur-md text-black text-[9px] font-bold px-4 py-1.5 uppercase tracking-[0.15em] shadow-[0_5px_15px_rgba(221,167,165,0.4)] rounded-full flex items-center">
                                                    <i className="fas fa-crown text-black/70 mr-1.5"></i> Best Seller
                                                </div>
                                            )}
                                            {product.is_new && (
                                                <div className="bg-white/90 backdrop-blur-md text-black text-[9px] font-bold px-4 py-1.5 uppercase tracking-[0.15em] shadow-[0_5px_15px_rgba(255,255,255,0.4)] rounded-full flex items-center">
                                                    ✨ Nuevo
                                                </div>
                                            )}
                                            {product.is_offer && (
                                                <div className="bg-red-500/90 backdrop-blur-md text-white text-[9px] font-bold px-4 py-1.5 uppercase tracking-[0.15em] shadow-[0_5px_15px_rgba(239,68,68,0.4)] rounded-full flex items-center">
                                                    Sale %
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isOutOfStock && (
                                        <div className="absolute inset-x-0 bottom-0 p-5 opacity-0 group-hover:opacity-100 transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 flex flex-col gap-2">
                                            <button
                                                onClick={() => setSelectedImage(product.image)}
                                                className="bg-[#111]/90 backdrop-blur-md text-white w-full py-2.5 font-bold text-[9px] uppercase tracking-[0.15em] hover:bg-white hover:text-black border border-white/20 transition-all duration-500 rounded-full flex items-center justify-center gap-2">
                                                <i className="fas fa-search-plus"></i> Ver Tamaño Real
                                            </button>
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="bg-white/95 backdrop-blur-md text-black w-full py-3.5 font-bold text-[10px] uppercase tracking-[0.15em] hover:bg-grecia-accent hover:text-white border border-transparent transition-all duration-500 shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_30px_rgba(221,167,165,0.4)] rounded-full">
                                                Agregar a la Bolsa
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center px-1 flex-grow flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-sans font-medium text-gray-200 text-sm md:text-[15px] mb-1 hover:text-white cursor-pointer transition tracking-wide">{product.name}</h3>

                                        {/* SOCIAL PROOF / REVIEWS (Idea 3) */}
                                        <div className="flex justify-center items-center gap-1 mb-2">
                                            <div className="flex text-[#FFC107] text-[9px]">
                                                <i className="fas fa-star"></i>
                                                <i className="fas fa-star"></i>
                                                <i className="fas fa-star"></i>
                                                <i className="fas fa-star"></i>
                                                <i className="fas fa-star-half-alt"></i>
                                            </div>
                                            <span className="text-[10px] text-gray-500 ml-1">(4.9)</span>
                                        </div>

                                        <div className="flex justify-center items-center gap-3 mb-3">
                                            <span className="text-white font-serif italic text-lg">${product.price}</span>
                                            {/* <p className="text-[#D2B48C] font-serif italic text-lg opacity-90">${product.price}</p> */} {/* This line was commented out as it seemed like a duplicate price display */}
                                        </div>
                                    </div>

                                    <div>
                                        {/* Swatches de Color Reales desde DB */}
                                        {product.colors && product.colors.length > 0 && (
                                            <div className="flex justify-center items-center gap-2 mb-3">
                                                {product.colors.map(colorHex => (
                                                    <div
                                                        key={colorHex}
                                                        className={`w-3.5 h-3.5 rounded-full border border-gray-700/50 shadow-inner`}
                                                        style={{ backgroundColor: colorHex }}
                                                        title="Opción de color"
                                                    ></div>
                                                ))}
                                            </div>
                                        )}

                                        {/* GUÍA DE TALLAS COLOMBIANA (Idea 5) */}
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">{product.category}</span>
                                            <span className="text-[10px] text-grecia-accent hover:text-white cursor-pointer transition mt-0.5 border-b border-dashed border-grecia-accent/30 hover:border-white">
                                                <i className="fas fa-ruler-combined mr-1"></i> Guía de Tallas (Horma Pequeña)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DE IMAGEN COMPLETA (LIGHTBOX) */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-12 animate-fade-in-up">
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 md:top-10 md:right-10 text-white/50 hover:text-white transition bg-black/50 w-12 h-12 rounded-full flex items-center justify-center"
                    >
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                    <div className="relative w-full h-full max-w-5xl max-h-[85vh] rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(221,167,165,0.15)] bg-[#050505]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={selectedImage}
                            alt="Vista Ampliada"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
