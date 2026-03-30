import Link from "next/link";
import Image from "next/image";

export default function Categories() {
    const categories = [
        {
            id: "jeans",
            title: "Jeans Levanta Cola",
            image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop",
            description: "Tecnología push-up y control de abdomen."
        },
        {
            id: "fajas",
            title: "Fajas Moldeadoras",
            image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop",
            description: "Define tu cintura y realza tu silueta."
        },
        {
            id: "bodys",
            title: "Bodys Control",
            image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=600&auto=format&fit=crop",
            description: "Ajuste perfecto para uso interior o exterior."
        },
        {
            id: "vestidos",
            title: "Vestidos Exclusivos",
            image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=600&auto=format&fit=crop",
            description: "Elegancia colombiana para cada ocasión."
        }
    ];

    return (
        <section id="categories" className="py-20 bg-[#0a0a0a]">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20 animate-fade-in-up">
                    <span className="text-grecia-accent text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase flex items-center justify-center gap-3 mb-3">
                        <span className="w-8 h-[1px] bg-grecia-accent/50"></span> El Arte de Vestir <span className="w-8 h-[1px] bg-grecia-accent/50"></span>
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif font-light mt-2 text-white tracking-wide">
                        Explora tu <span className="italic text-gray-400 font-medium">Estilo</span>
                    </h2>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto text-sm md:text-base font-light tracking-wide">
                        Especialistas en resaltar tus curvas. Descubre las colecciones exclusivas que han convertido
                        nuestra curaduría de moda colombiana en el secreto mejor guardado de New Jersey.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat, index) => (
                        <Link href={`#store`} key={cat.id} className="group block relative overflow-hidden rounded-[2rem] h-[450px] shadow-2xl hover:shadow-[0_20px_40px_rgba(221,167,165,0.1)] transition-all duration-700 animate-fade-in-up" style={{ animationDelay: `${index * 0.15}s` }}>
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-[#4a2e2d]/40 transition duration-700 z-10"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 transition duration-700"></div>
                            <Image
                                src={cat.image}
                                alt={cat.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                className="object-cover transform group-hover:scale-105 transition duration-[1.5s] ease-out"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform translate-y-6 group-hover:translate-y-0 transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                                <h3 className="text-2xl font-serif font-light text-white mb-2">{cat.title}</h3>
                                <p className="text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-100 leading-relaxed font-light">{cat.description}</p>
                                <div className="mt-5 inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-grecia-accent group-hover:text-white transition-colors duration-500">
                                    Explorar <i className="fas fa-seedling ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></i>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
