"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const { user } = useAuthStore();
    const { cart, removeFromCart, updateCartItemQuantity, clearCart } = useCartStore();
    const [isStripeLoading, setIsStripeLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    // ---------------------------------------------
    // 1. MANEJADOR DE PAGO STRIPE (Redirección)
    // ---------------------------------------------
    // ---------------------------------------------
    const handleStripeCheckout = async () => {
        if (cart.length === 0) return;
        if (!termsAccepted) {
            toast.error("Debes aceptar los Términos y Condiciones (Corporate Compliance) antes de proceder al pago.");
            return;
        }
        setIsStripeLoading(true);

        try {
            // Llamar a nuestra API Route Backend
            const response = await fetch('/api/checkout_sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    customerEmail: user?.email,
                    userId: user?.id,
                }),
            });

            const session = await response.json();

            if (session.error) throw new Error(session.error);

            // Redirigir la ventana a la página segura de Stripe Hosted Checkout usando la URL provista por el Server
            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error("El servidor de Stripe no retornó una URL válida de pago.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al conectar con el servidor de pagos (Stripe).");
        } finally {
            setIsStripeLoading(false);
        }
    };

    // ---------------------------------------------
    // 2. MANEJADORES DE PAGO WHATSAPP
    // ---------------------------------------------
    const handleWhatsAppCheckout = () => {
        if (cart.length === 0) return;
        if (!termsAccepted) {
            toast.error("Debes aceptar los Términos y Condiciones (Corporate Compliance) antes de proceder.");
            return;
        }
        const phone = "1234567890"; // Reemplazar
        let message = "Hola Grecia Fashion Store! 👋%0AQuiero realizar el siguiente pedido manual:%0A%0A";
        cart.forEach((item, index) => {
            message += `${index + 1}. *${item.name}* (${item.quantity}x)%0A`;
        });
        message += `%0A*Total: $${subtotal.toFixed(2)}*%0A`;
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        clearCart();
        onClose();
    };

    return (
        <>
            <div id="cart-sidebar" className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-black border-l border-gray-800 shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#0a0a0a]">
                    <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                        <i className="fas fa-shopping-bag text-grecia-accent"></i> Tu Bolsa de Compras
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition bg-gray-900 w-8 h-8 rounded-full flex items-center justify-center" aria-label="Cerrar carrito de compras">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Área Scroll de Ítems */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#050505]">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <i className="fas fa-shopping-basket text-5xl mb-4"></i>
                            <p className="text-sm">Tu bolsa está vacía</p>
                            <p className="text-xs mt-2 text-center max-w-[200px]">Explora nuestro catálogo y añade tus prendas favoritas.</p>
                            <button onClick={onClose} className="mt-6 border border-gray-700 hover:border-grecia-accent hover:text-white text-xs px-6 py-2 rounded uppercase tracking-widest transition">
                                Volver a la Tienda
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-4 bg-[#111] border border-gray-900 p-3 rounded-lg relative group">
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="absolute -top-2 -right-2 bg-red-900 border border-red-700 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition shadow-lg z-10 hover:bg-red-600"
                                        aria-label={`Eliminar ${item.name} del carrito`}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>

                                    <Image src={item.image} alt={item.name} width={80} height={96} className="object-cover rounded border border-gray-800" />

                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="text-white font-serif font-bold text-sm leading-tight pr-4">{item.name}</h3>
                                            <p className="text-[10px] text-grecia-accent uppercase tracking-wider mt-1">{item.category}</p>
                                        </div>

                                        <div className="flex items-end justify-between mt-2">
                                            <div className="flex items-center gap-3 bg-black border border-gray-800 rounded px-2 py-1">
                                                <button onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} className="text-gray-400 hover:text-white transition w-5 text-center" aria-label={`Disminuir cantidad de ${item.name}`}>-</button>
                                                <span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} className="text-gray-400 hover:text-white transition w-5 text-center" aria-label={`Aumentar cantidad de ${item.name}`}>+</button>
                                            </div>
                                            <span className="text-white font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Zona de Cobro */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-gray-800 bg-[#0a0a0a]">
                        <div className="flex justify-between mb-2 text-sm text-gray-400">
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm text-gray-400">
                            <span>Impuestos / Envío:</span>
                            <span className="text-green-500 font-bold">Por calcular</span>
                        </div>
                        <div className="flex justify-between mb-6 text-xl font-serif font-bold text-white border-t border-gray-800 pt-3 mt-3">
                            <span>Total estimado:</span>
                            <span className="text-grecia-accent">${subtotal.toFixed(2)}</span>
                        </div>

                        {/* Aviso de Recojo Exclusivo */}
                        <div className="bg-[#111] border border-gray-800 rounded p-3 mb-4 flex items-start gap-3">
                            <i className="fas fa-store text-grecia-accent mt-0.5"></i>
                            <p className="text-[11px] text-gray-300">
                                <span className="text-white font-bold opacity-100">Políticas de Entrega:</span> Todas las compras completadas a través de este medio son exclusivamente para <span className="text-white font-bold underline decoration-grecia-accent">recojo físico presencial en nuestra boutique</span>.
                            </p>
                        </div>

                        {/* Botonera de Pasarelas / Bloqueo por Sesión */}
                        {!user ? (
                            <div className="text-center bg-gray-900 border border-gray-800 rounded-lg p-5">
                                <i className="fas fa-lock text-gray-500 text-3xl mb-3"></i>
                                <p className="text-sm text-white font-bold mb-2 uppercase tracking-wide">Autenticación Requerida</p>
                                <p className="text-[11px] text-gray-400 mb-4 px-2">
                                    Para garantizar la máxima seguridad transaccional, debes iniciar sesión o crear una cuenta de cliente para poder procesar tu pago.
                                </p>
                                <button
                                    onClick={() => {
                                        onClose();
                                        // Truco: Hacer click automatizado en el ícono de login del Header
                                        document.getElementById('user-icon')?.click();
                                    }}
                                    className="w-full bg-white text-black py-3 font-bold hover:bg-gray-200 transition text-xs uppercase tracking-widest rounded"
                                >
                                    Iniciar Sesión / Registrarse
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Stripe (Tarjetas, Apple Pay, Google Pay) */}
                                <button
                                    onClick={handleStripeCheckout}
                                    disabled={isStripeLoading}
                                    className="w-full bg-[#635BFF] text-white py-3.5 font-bold hover:bg-[#5249DE] transition flex items-center justify-center gap-2 shadow-lg rounded hover:shadow-[#635BFF]/30 disabled:opacity-50 text-sm"
                                >
                                    {isStripeLoading ? (
                                        <i className="fas fa-spinner fa-spin"></i>
                                    ) : (
                                        <>
                                            <i className="fas fa-credit-card text-lg"></i> Pagar Seguro con Stripe
                                        </>
                                    )}
                                </button>

                                {/* PayPal Oculto Temporalmente por Petición del Cliente */}
                                {/* 
                                <div className="relative z-0 mt-2 min-h-[45px]">
                                    <PayPalScriptProvider options={{
                                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb",
                                        currency: "USD",
                                        components: "buttons"
                                    }}>
                                        <PayPalButtons
                                            createOrder={createPayPalOrder}
                                            onApprove={onPayPalApprove}
                                            style={{ layout: "vertical", color: "gold", shape: "rect", height: 45 }}
                                        />
                                    </PayPalScriptProvider>
                                </div> 
                                */}

                                {/* Divider Visual */}
                                <div className="flex items-center my-5 opacity-50">
                                    <div className="flex-1 h-px bg-gray-700"></div>
                                    <span className="px-3 text-[10px] text-gray-400 uppercase tracking-widest">O cordina sin pago</span>
                                    <div className="flex-1 h-px bg-gray-700"></div>
                                </div>

                                <div className="bg-[#151515] p-6 mb-6">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                className="appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-black checked:bg-grecia-accent checked:border-grecia-accent transition-colors cursor-pointer"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                            />
                                            {termsAccepted && <i className="fas fa-check absolute text-[10px] text-white pointer-events-none"></i>}
                                        </div>
                                        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition">
                                            He leído y autorizo el acuerdo legal de <a href="/terms" target="_blank" className="text-grecia-accent hover:underline">Políticas de Privacidad, Contracargos y Devoluciones</a> (Corporate Compliance).
                                        </span>
                                    </label>
                                </div>

                                {/* PAGO CON TARJETA DE CRÉDITO (STRIPE) */}
                                <button
                                    onClick={handleWhatsAppCheckout}
                                    className="w-full bg-transparent border border-gray-700 text-gray-300 py-2.5 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition flex items-center justify-center gap-2 rounded text-[11px] uppercase tracking-widest"
                                >
                                    <i className="fab fa-whatsapp text-sm"></i> Reservar vía WhatsApp
                                </button>
                            </div>
                        )}

                        <p className="text-[10px] text-center text-gray-600 mt-5">
                            <i className="fas fa-shield-alt mr-1"></i> Transacciones encriptadas 256-bit SSL.
                        </p>
                    </div>
                )}
            </div>

            {/* Backdrop Negro */}
            {isOpen && (
                <div onClick={onClose} className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity"></div>
            )}
        </>
    );
}

