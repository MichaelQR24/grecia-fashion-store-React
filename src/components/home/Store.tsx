"use client";

import { useAppContext } from "@/context/AppContext";

export default function Store() {
    const { products } = useAppContext();

    return (
        <section id="store" className="py-20 bg-[#050505] min-h-screen border-t border-gray-900">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-grecia-accent text-xs tracking-[0.2em] font-bold uppercase flex items-center justify-center gap-2">
                        <i className="fas fa-fire"></i> Lo Más Pedido
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mt-3 text-white">Nuestra Colección</h2>
                    <div className="w-16 h-[2px] bg-grecia-accent mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => {
                        const isOutOfStock = product.stock <= 0;
                        return (
                            <div key={product.id} className="group relative transition duration-300">
                                <div className="relative overflow-hidden rounded-md mb-4 bg-[#111111] border border-gray-900 aspect-[3/4]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={product.image} alt={product.name} className={`w-full h-full object-cover transition duration-700 ${isOutOfStock ? 'grayscale opacity-30' : 'group-hover:scale-110 opacity-80 group-hover:opacity-100'}`} />

                                    {isOutOfStock ? (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                            <span className="bg-red-600 text-white px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-sm border border-red-400 transform -rotate-12 shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                                                Stock Agotado
                                            </span>
                                        </div>
                                    ) : product.stock < 5 ? (
                                        <div className="absolute top-2 left-2 bg-grecia-accent text-white text-[9px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm animate-pulse-slow z-10 shadow-lg">
                                            Últimas {product.stock} disp!
                                        </div>
                                    ) : null}

                                    {!isOutOfStock && (
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300 z-20">
                                            <button className="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-grecia-accent hover:text-white shadow-[0_0_15px_rgba(255,255,255,0.3)] transition" title="Agregar a la bolsa">
                                                <i className="fas fa-shopping-bag"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-serif font-bold text-white text-base leading-tight truncate pr-2 hover:text-grecia-accent cursor-pointer transition">{product.name}</h3>
                                        <span className="text-white font-medium">${product.price}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-grecia-accent uppercase tracking-wider">{product.category}</p>
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
