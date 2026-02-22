export default function Benefits() {
    const benefits = [
        {
            icon: "fas fa-gem",
            title: "Calidad 100% Colombiana",
            description: "Prendas confeccionadas con los mejores textiles que garantizan durabilidad y comodidad extrema."
        },
        {
            icon: "fas fa-heart",
            title: "Horma Perfecta",
            description: "Nuestros diseños exclusivos, fajas y jeans Push-Up están creados para realzar tu belleza natural."
        },
        {
            icon: "fas fa-truck-fast",
            title: "Envíos Seguros",
            description: "Despachos rápidos dentro de New Jersey y todo Estados Unidos con seguimiento."
        },
        {
            icon: "fas fa-user-check",
            title: "Asesoría de Tallas",
            description: "Te guiamos personalmente por WhatsApp para que elijas la talla y prenda perfecta para ti."
        }
    ];

    return (
        <section className="py-16 bg-[#050505] border-t border-gray-900 border-b relative z-10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-6 rounded-lg bg-[#111] border border-gray-800 hover:border-grecia-accent transition duration-300 card-hover">
                            <div className="w-16 h-16 rounded-full bg-grecia-accent/10 flex items-center justify-center text-grecia-accent text-3xl mb-4">
                                <i className={benefit.icon}></i>
                            </div>
                            <h3 className="text-white font-serif font-bold text-lg mb-2">{benefit.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
