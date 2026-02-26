export default function Footer() {
    return (
        <footer className="bg-black text-white pt-20 pb-8 border-t border-gray-900">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 border-b border-gray-900 pb-12">
                    <div>
                        <h2 className="text-2xl font-serif font-bold mb-4 flex gap-1">
                            <span className="text-grecia-accent italic">Grecia</span>
                            <span className="text-white">Fashion</span>
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Moda auténtica en New Jersey. Elevamos tu estilo con prendas exclusivas y atención personalizada.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-200">Contacto</h3>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li className="flex items-start"><i className="fas fa-map-marker-alt mt-1 mr-3 text-grecia-accent"></i> 359 Kearny Ave,<br />Kearny, NJ 07032</li>
                            <li className="flex items-center"><i className="fab fa-whatsapp mr-3 text-grecia-accent"></i> +1 (551) 253-8886</li>
                            <li className="flex items-center"><i className="fas fa-envelope mr-3 text-grecia-accent"></i> info@greciafashion.com</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-200">Legal</h3>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li><a href="/terms" className="hover:text-grecia-accent transition block">Corporate Compliance (Terms)</a></li>
                            <li><a href="/terms" className="hover:text-grecia-accent transition block">Exchange & Return Policy</a></li>
                            <li><a href="/terms" className="hover:text-grecia-accent transition block">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-200">Síguenos</h3>
                        <div className="flex gap-4">
                            <a href="https://www.instagram.com/greciafashionstore/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-grecia-accent hover:text-white transition group border border-gray-800 hover:border-transparent">
                                <i className="fab fa-instagram text-xl group-hover:scale-110 transition duration-300"></i>
                            </a>
                            <a href="https://www.facebook.com/GreciaFashionStore" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-blue-600 hover:text-white transition group border border-gray-800 hover:border-transparent">
                                <i className="fab fa-facebook-f text-xl group-hover:scale-110 transition duration-300"></i>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-gray-200">Pagos Aceptados</h3>
                        <p className="text-gray-400 text-sm mb-4">Aceptamos Zelle, tarjetas y efectivo en tienda.</p>
                        <div className="flex flex-wrap gap-2 text-2xl text-gray-500">
                            <i className="fab fa-cc-visa hover:text-white transition" title="Visa"></i>
                            <i className="fab fa-cc-mastercard hover:text-white transition" title="Mastercard"></i>
                            <i className="fab fa-cc-apple-pay hover:text-white transition" title="Apple Pay"></i>
                            <i className="fas fa-money-bill-wave hover:text-white transition" title="Efectivo / Zelle"></i>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                    <p>&copy; {new Date().getFullYear()} Grecia Fashion Store. Todos los derechos reservados.</p>
                    <p className="mt-2 md:mt-0 flex items-center">Diseñado con <i className="fas fa-heart text-grecia-accent mx-1"></i> para mujeres reales.</p>
                </div>
            </div>
        </footer>
    );
}
