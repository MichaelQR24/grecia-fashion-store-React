export default function VisitUs() {
    return (
        <section id="visit-us" className="py-20 bg-[#0a0a0a] border-t border-gray-900">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-grecia-accent text-xs tracking-widest font-bold uppercase">Nuestra Boutique</span>
                        <h2 className="text-4xl font-serif font-bold mt-4 text-white mb-6">Tu Figura, Nuestra Prioridad.</h2>
                        <p className="text-gray-400 leading-relaxed mb-6 font-light text-lg">
                            En <span className="font-serif italic text-grecia-accent font-bold">Grecia Fashion Store</span>, traemos lo mejor de la moda colombiana directamente a New Jersey. Fajas, levanta cola y prendas diseñadas para brindarte la horma perfecta y hacerte sentir imparable.
                        </p>

                        <div className="bg-[#111111] p-6 rounded-lg border border-gray-800 hover:border-grecia-accent transition duration-300">
                            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-800">
                                <div className="text-grecia-accent text-2xl"><i className="fas fa-map-marked-alt"></i></div>
                                <div>
                                    <h4 className="font-bold text-white font-serif">Visítanos en Kearny</h4>
                                    <p className="text-sm text-gray-400 mt-1">359 Kearny Ave, Kearny, NJ</p>
                                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-xs text-white font-bold uppercase mt-2 inline-block border-b border-grecia-accent hover:text-grecia-accent transition">Ver en Mapa</a>
                                </div>
                            </div>

                            {/* Social Media Links */}
                            <div className="flex items-center gap-4">
                                <div className="text-grecia-accent text-2xl"><i className="fas fa-hashtag"></i></div>
                                <div>
                                    <h4 className="font-bold text-white font-serif mb-2 text-sm">Nuestras Redes</h4>
                                    <div className="flex gap-3">
                                        <a href="https://www.instagram.com/greciafashionstore/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-grecia-accent hover:text-white transition group border border-gray-800 hover:border-transparent">
                                            <i className="fab fa-instagram text-sm group-hover:scale-110 transition duration-300"></i>
                                        </a>
                                        <a href="https://www.facebook.com/GreciaFashionStore" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition group border border-gray-800 hover:border-transparent">
                                            <i className="fab fa-facebook-f text-sm group-hover:scale-110 transition duration-300"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(255,42,122,0.15)] border-2 border-grecia-accent/50 h-[450px] relative transform hover:scale-[1.01] transition duration-500">
                            <iframe
                                width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight={0} marginWidth={0}
                                src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=es&amp;q=359%20Kearny%20Ave,%20Kearny,%20NJ&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                                style={{ filter: "invert(90%) hue-rotate(180deg) contrast(100%)" }}
                                title="Mapa de Grecia Fashion Store"
                            >
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
