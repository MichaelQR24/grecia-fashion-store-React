import Link from "next/link";

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
                <div className="text-center mb-16">
                    <span className="text-grecia-accent text-xs tracking-[0.2em] font-bold uppercase flex items-center justify-center gap-2">
                        <i className="fas fa-star"></i> Líneas Exclusivas
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mt-3 text-white">Explora tu Estilo</h2>
                    <div className="w-16 h-[2px] bg-grecia-accent mx-auto mt-6"></div>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto text-sm">
                        Especialistas en resaltar tus curvas. Descubre las categorías que han convertido
                        a nuestra moda colombiana en la preferida de nuestras clientas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                        <Link href={`#store`} key={cat.id} className="group block relative overflow-hidden rounded-xl h-[400px]">
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition duration-500 z-10"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={cat.image}
                                alt={cat.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-in-out"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition duration-500">
                                <h3 className="text-xl font-serif font-bold text-white mb-2">{cat.title}</h3>
                                <p className="text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition duration-500 delay-100">{cat.description}</p>
                                <div className="mt-4 inline-flex items-center text-xs font-bold uppercase tracking-widest text-grecia-accent">
                                    Ver Colección <i className="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition duration-300"></i>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
