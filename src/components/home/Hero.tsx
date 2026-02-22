import Link from "next/link";

export default function Hero() {
    return (
        <section id="home" className="relative h-[70vh] flex items-center justify-center hero-bg border-b border-gray-900">
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="container mx-auto px-6 relative z-10 text-center">
                <span className="inline-block px-3 py-1 bg-black/50 backdrop-blur-md border border-gray-700 text-grecia-accent text-[10px] font-bold tracking-[0.2em] uppercase mb-6 rounded-full animate-fade-in">
                    Boutique Exclusiva
                </span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium text-white mb-6 leading-tight drop-shadow-2xl animate-slide-up">
                    Elegancia que <br /><span className="italic font-normal text-grecia-accent">inspira.</span>
                </h1>
                <p className="text-lg md:text-xl font-light text-gray-300 mb-10 max-w-xl mx-auto drop-shadow-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    Descubre nuestra colección en tiempo real. Selecciona, enamórate y brilla.
                </p>
                <Link href="#store" className="inline-block bg-grecia-accent text-white px-12 py-4 font-medium text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition duration-500 shadow-[0_0_20px_rgba(255,42,122,0.5)] transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    Ver Catálogo
                </Link>
            </div>
        </section>
    );
}
