import Link from "next/link";
import Image from "next/image";

export default function Hero() {
    return (
        <section id="home" className="relative sm:h-[100vh] h-[90vh] flex items-center justify-center overflow-hidden border-b border-gray-900">
            {/* Background Image with Ken Burns effect */}
            <div className="absolute inset-0 z-0 bg-black">
                <div className="absolute inset-0 bg-black/30 z-10 transition duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent z-10"></div>

                <Image
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
                    alt="Fashion Model Background"
                    fill
                    priority
                    className="object-cover animate-ken-burns scale-110 origin-center opacity-90"
                />
            </div>

            <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center pt-20">
                <div className="glass-panel p-10 md:p-16 rounded-[2.5rem] animate-fade-in-up animate-float max-w-3xl w-full mx-auto border-t border-white/10">
                    <span className="inline-block px-5 py-2 bg-grecia-accent/10 border border-grecia-accent/30 text-grecia-accent text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-8 rounded-full shadow-[0_0_20px_rgba(221,167,165,0.15)]">
                        Nueva Colección 2026
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif font-light text-white mb-6 leading-tight drop-shadow-2xl">
                        Elegancia que <br /><span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-grecia-accent via-pink-200 to-white">inspira.</span>
                    </h1>
                    <p className="text-sm md:text-lg font-light text-gray-300 mb-10 mx-auto drop-shadow-md tracking-wider max-w-lg leading-relaxed">
                        Descubre nuestra colección exclusiva. Selecciona, enamórate y brilla con auténtica moda estilo boutique.
                    </p>
                    <Link href="#store" className="inline-block bg-white text-black px-12 md:px-14 py-4 font-bold text-xs tracking-[0.2em] uppercase hover:bg-grecia-accent hover:text-white transition-all duration-500 shadow-[0_15px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_15px_30px_rgba(221,167,165,0.4)] transform hover:-translate-y-1 rounded-full group">
                        Ver Catálogo <i className="fas fa-arrow-right ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"></i>
                    </Link>
                </div>
            </div>
        </section>
    );
}
