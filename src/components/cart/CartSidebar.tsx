"use client";

import { useAppContext } from "@/context/AppContext";

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
    const { cart, removeFromCart, updateCartItemQuantity, clearCart } = useAppContext();

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    const handleCheckout = () => {
        if (cart.length === 0) return;

        const phone = "1234567890"; // Reemplazar con el número del cliente

        let message = "Hola Grecia Fashion Store! 👋%0AQuiero realizar el siguiente pedido:%0A%0A";

        cart.forEach((item, index) => {
            message += `${index + 1}. *${item.name}*%0A`;
            message += `   Categoría: ${item.category}%0A`;
            message += `   Cantidad: ${item.quantity} x $${item.price}%0A`;
            message += `   Sub: $${(item.price * item.quantity).toFixed(2)}%0A%0A`;
        });

        message += `*Total a pagar: $${subtotal.toFixed(2)}*%0A%0A Quedo atento(a) para el pago y envío.`;

        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
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
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition bg-gray-900 w-8 h-8 rounded-full flex items-center justify-center">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

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
                                        title="Eliminar de la bolsa"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>

                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded border border-gray-800" />

                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h3 className="text-white font-serif font-bold text-sm leading-tight pr-4">{item.name}</h3>
                                            <p className="text-[10px] text-grecia-accent uppercase tracking-wider mt-1">{item.category}</p>
                                        </div>

                                        <div className="flex items-end justify-between mt-2">
                                            <div className="flex items-center gap-3 bg-black border border-gray-800 rounded px-2 py-1">
                                                <button
                                                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                                    className="text-gray-400 hover:text-white transition w-5 text-center"
                                                >
                                                    -
                                                </button>
                                                <span className="text-white text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                                    className="text-gray-400 hover:text-white transition w-5 text-center"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-white font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-6 border-t border-gray-800 bg-[#0a0a0a]">
                        <div className="flex justify-between mb-2 text-sm text-gray-400">
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm text-gray-400">
                            <span>Envío:</span>
                            <span className="text-green-500 font-bold">Por calcular</span>
                        </div>
                        <div className="flex justify-between mb-6 text-xl font-serif font-bold text-white border-t border-gray-800 pt-3 mt-3">
                            <span>Total estimado:</span>
                            <span className="text-grecia-accent">${subtotal.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-white text-black py-4 font-bold hover:bg-grecia-accent hover:text-white transition flex items-center justify-center gap-2 shadow-lg rounded-sm uppercase tracking-widest text-sm"
                        >
                            <i className="fab fa-whatsapp text-lg"></i> Comprar por WhatsApp
                        </button>
                        <p className="text-[10px] text-center text-gray-500 mt-3 align-middle">
                            <i className="fas fa-lock mr-1"></i> Checkout manual 100% seguro.
                        </p>
                    </div>
                )}
            </div>

            {/* Backdrop / Overlay oscuro tras el menú */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity"
                ></div>
            )}
        </>
    );
}
