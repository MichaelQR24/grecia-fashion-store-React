"use client";

import Link from "next/link";

export default function CheckoutCanceledPage() {

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-black text-center animate-fade-in-up mt-20">
            <div className="w-24 h-24 bg-red-900/40 rounded-full flex items-center justify-center mb-8 border border-red-500 m-auto">
                <i className="fas fa-times text-4xl text-red-500"></i>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif text-white mb-4">
                Transacción Incompleta
            </h1>

            <p className="text-gray-400 max-w-xl mx-auto mb-12 text-sm md:text-base leading-relaxed">
                Tu pago no fue procesado o ha sido cancelado. No te preocupes, tus datos están seguros y ningún cobro fue realizado. Puedes volver al carrito para intentar con otro método de pago.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                    href="/"
                    className="w-full sm:w-auto px-8 py-3 bg-white text-black hover:bg-grecia-accent hover:text-white rounded transition uppercase tracking-widest text-xs font-bold shadow-lg"
                >
                    <i className="fas fa-shopping-bag mr-2"></i> Volver al Catálogo
                </Link>
            </div>
        </div>
    );
}
