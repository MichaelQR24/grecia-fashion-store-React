export default function Testimonials() {
    const testimonials = [
        {
            name: "Carolina M.",
            location: "Kearny, NJ",
            text: "¡Los jeans levanta cola son increíbles! La horma es perfecta, no se deforman y la calidad de la tela se nota enseguida que es colombiana original. Me siento súper segura.",
            rating: 5
        },
        {
            name: "Diana P.",
            location: "New York, NY",
            text: "Compré una faja moldeadora buscando reducir medidas para un evento. El ajuste es firme pero sorprendentemente cómodo. El equipo me asesoró perfecto con mi talla por WhatsApp.",
            rating: 5
        },
        {
            name: "Valeria G.",
            location: "Elizabeth, NJ",
            text: "Los bodys de control son mi nueva adicción. Los uso como blusa normal y me estilizan la figura hermoso. Ya he comprado 3 y seguiré comprando. Excelente servicio.",
            rating: 5
        }
    ];

    return (
        <section id="testimonials" className="py-20 bg-black border-t border-gray-900 border-b relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-grecia-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-grecia-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-grecia-accent text-xs tracking-[0.2em] font-bold uppercase flex items-center justify-center gap-2">
                        <i className="fas fa-comment-dots"></i> Testimonios
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mt-3 text-white">Lo que Ellas Dicen</h2>
                    <div className="w-16 h-[2px] bg-grecia-accent mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, i) => (
                        <div key={i} className="bg-[#111] p-8 rounded-xl border border-gray-800 relative card-hover">
                            <i className="fas fa-quote-right absolute top-6 right-6 text-4xl text-grecia-accent/20"></i>
                            <div className="flex gap-1 text-grecia-accent mb-4 text-sm">
                                {[...Array(testimonial.rating)].map((_, index) => (
                                    <i key={index} className="fas fa-star"></i>
                                ))}
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                                &quot;{testimonial.text}&quot;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-grecia-accent to-pink-900 flex items-center justify-center text-white font-serif font-bold text-lg">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">{testimonial.name}</h4>
                                    <p className="text-gray-500 text-xs">{testimonial.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
