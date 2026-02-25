"use client";

import { useAppContext } from "@/context/AppContext";

export default function Store() {
    const { products, addToCart } = useAppContext();

    const handleAddToCart = (product: any) => {
        addToCart(product);
        // Opcional: Feedback visual rápido (toast en el futuro)
    };

    return (
        <section id="store" className="py-20 bg-[#050505] min-h-screen border-t border-gray-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                    <span className="text-grecia-accent text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase flex items-center justify-center gap-3 mb-3">
                        <span className="w-8 h-[1px] bg-grecia-accent/50"></span> Selección Exclusiva <span className="w-8 h-[1px] bg-grecia-accent/50"></span>
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-light mt-2 text-white tracking-wide">
                        Must <span className="italic text-gray-400 font-medium">Haves</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {products.map((product, index) => {
                        const isOutOfStock = product.stock <= 0;
                        const isBestSeller = index === 0 || index === 4;
                        const isNew = index === 1 || index === 5;

                        return (
                            <div key={product.id} className="group relative transition duration-[1.5s] animate-fade-in-up flex flex-col">
                                <div className="relative overflow-hidden mb-5 bg-[#0a0a0a] aspect-[3/4] rounded-[2rem] shadow-xl hover:shadow-[0_20px_40px_rgba(221,167,165,0.08)] transition-all duration-700">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.image} alt={product.name} className={`w-full h-full object-cover transition duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] ${isOutOfStock ? 'grayscale opacity-30' : 'group-hover:scale-105 opacity-90 group-hover:opacity-100'}`} />

                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-[#4a2e2d]/20 transition duration-700 z-10 pointer-events-none mix-blend-multiply"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-700 z-10 pointer-events-none"></div>

                                    {/* BADGES DE ESCASES Y NOVEDAD */}
                                    {isOutOfStock ? (
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <span className="bg-red-900/80 backdrop-blur-md text-red-100 px-6 py-2 text-[10px] font-bold tracking-[0.2em] uppercase rounded-full border border-red-500/30 shadow-2xl">
                                                Sold Out
                                            </span>
                                        </div>
                                    ) : product.stock > 0 && product.stock <= 5 ? (
                                        <div className="absolute top-5 left-5 bg-grecia-accent/90 backdrop-blur-md text-white text-[9px] font-bold px-4 py-1.5 uppercase tracking-[0.2em] shadow-[0_5px_15px_rgba(221,167,165,0.4)] z-20 rounded-full">
                                            Last {product.stock}
                                        </div>
                                    ) : isBestSeller ? (
                                        <div className="absolute top-5 left-5 bg-[#DDA7A5]/90 backdrop-blur-md text-black text-[9px] font-bold px-4 py-1.5 uppercase tracking-[0.15em] shadow-[0_5px_15px_rgba(221,167,165,0.4)] z-20 rounded-full">
                                            <i className="fas fa-crown text-black/70 mr-1.5"></i> Best Seller
                                        </div>
                                    ) : isNew ? (
                                        <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md text-black text-[9px] font-bold px-4 py-1.5 uppercase tracking-[0.15em] shadow-[0_5px_15px_rgba(255,255,255,0.4)] z-20 rounded-full">
                                            ✨ Nuevo
                                        </div>
                                    ) : null}

                                    {!isOutOfStock && (
                                        <div className="absolute inset-x-0 bottom-0 p-5 opacity-0 group-hover:opacity-100 transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-20">
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
        </section>
    );
}
