"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

import { useCartStore } from "@/store/useCartStore";

export default function CheckoutSuccessPage() {
    const [statusText] = useState("¡Transacción Completada Exitosamente! 🎉");
    const { clearCart } = useCartStore();
    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;
        hasVerified.current = true;

        // Limpiar el carrito local tras el pago (El Webhook ya se encargó de la Base de Datos)
        clearCart();
    }, [clearCart]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-black text-center animate-fade-in-up mt-20">
            <div className="w-24 h-24 bg-green-900/40 rounded-full flex items-center justify-center mb-8 border border-green-500 m-auto">
                <i className="fas fa-check text-4xl text-green-500 animate-pulse-slow"></i>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif text-white mb-4">
                {statusText}
            </h1>

            <p className="text-gray-400 max-w-xl mx-auto mb-12 text-sm md:text-base leading-relaxed">
                Tu pago ha sido procesado de manera segura. Te hemos enviado un correo electrónico con los detalles de la compra y el número de seguimiento. Gracias por confiar en Grecia Fashion Store.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                    href="/user"
                    className="w-full sm:w-auto px-8 py-3 bg-[#111] border border-gray-700 hover:border-white text-white rounded transition uppercase tracking-widest text-xs font-bold"
                >
                    <i className="fas fa-receipt mr-2"></i> Ver Mis Pedidos
                </Link>

                <Link
                    href="/"
                    className="w-full sm:w-auto px-8 py-3 bg-white text-black hover:bg-grecia-accent hover:text-white rounded transition uppercase tracking-widest text-xs font-bold"
                >
                    Volver a la Tienda
                </Link>
            </div>
        </div>
    );
}
