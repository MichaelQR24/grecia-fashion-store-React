"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useProductStore } from "@/store/useProductStore";
import { useCartStore } from "@/store/useCartStore";
import CartSidebar from "@/components/cart/CartSidebar";
import { createClient } from "@/utils/supabase/client";
import { isAdmin } from "@/lib/permissions";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);

    // Inicializar Zustands globales al montar la App
    useAuthStore.getState().initialize();
    useProductStore.getState().initialize();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Estados Globales Simulación Login y Carrito
  const { user, userRole, setUserRole } = useAuthStore();
  const { cart } = useCartStore();

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loginError, setLoginError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      if (!isLoginMode) {
        // ✅ Registro vía API (con rate limiting)
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, phone }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setLoginError(data.message || 'Error en el registro.');
        } else {
          setLoginError(data.message || "✅ ¡Registro exitoso! Revisa tu correo.");
          setIsLoginMode(true);
        }
        return;
      }

      // ✅ Login vía API (con rate limiting de 5 intentos/min)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.message || "Credenciales incorrectas.");
        return;
      }

      // Login exitoso — sincronizar sesión del SDK con la cookie ya creada por el servidor
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });

      setUserRole(data.role);
      setLoginModalOpen(false);
      setEmail("");
      setPassword("");
      setPhone("");

      // Redirección con refresco de estado
      if (data.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch {
      setLoginError("Error conectando con el servidor.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      });
      if (error) throw error;
    } catch {
      setLoginError("Error inicializando sesión con Google.");
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUserRole(null);
      window.location.href = '/';
    } catch {
      console.error("Error cerrando sesión local");
    }
  };

  return (
    <>
      <header className={`fixed w-full top-0 z-40 transition-all duration-700 ${isScrolled ? "bg-black/98 border-b border-gray-900 backdrop-blur-xl shadow-2xl" : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"}`}>

        {/* Top Banner (Desaparece al Scrollear) */}
        <div className={`bg-grecia-accent text-white flex justify-between items-center font-medium tracking-wider uppercase transition-all duration-500 overflow-hidden ${isScrolled ? "h-0 opacity-0" : "h-8 md:h-10 px-4 opacity-100"}`}>
          <div className="hidden md:flex gap-4">
            <a href="https://www.instagram.com/greciafashionstore/" target="_blank" rel="noopener noreferrer" className="hover:text-black transition text-xs">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.facebook.com/GreciaFashionStore" target="_blank" rel="noopener noreferrer" className="hover:text-black transition text-xs">
              <i className="fab fa-facebook-f"></i>
            </a>
          </div>
          <div className="mx-auto md:mx-0 text-[10px] md:text-[11px]">
            🚚 Envíos rápidos y seguros en New Jersey
          </div>
        </div>

        {/* Main Header Container */}
        <div className={`container mx-auto px-4 md:px-6 transition-all duration-500 flex items-center justify-between ${isScrolled ? "py-3" : "py-5"}`}>

          {/* MOBILE LEFT: Hamburger Menu */}
          <div className="flex-1 md:hidden flex justify-start">
            <button className="text-white text-2xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Abrir menú de navegación">
              <i className="fas fa-bars"></i>
            </button>
          </div>

          {/* DESKTOP LEFT: Navigation Tabs */}
          <nav className="hidden md:flex flex-1 space-x-8 items-center justify-start">
            <Link href="#categories" className="text-xs font-semibold text-gray-300 hover:text-grecia-accent tracking-widest uppercase transition">Líneas</Link>
            <Link href="#store" className="text-xs font-semibold text-grecia-accent hover:text-white tracking-widest uppercase transition">Catálogo</Link>
            <Link href="#testimonials" className="text-xs font-semibold text-gray-300 hover:text-grecia-accent tracking-widest uppercase transition">Reseñas</Link>
            <Link href="#visit-us" className="text-xs font-semibold text-gray-300 hover:text-grecia-accent tracking-widest uppercase transition">Visítanos</Link>
          </nav>

          {/* CENTER: Dynamic Logo Responsive */}
          <Link href="/" className="flex flex-col items-center group shrink-0">
            <span className="text-2xl md:text-3xl font-serif font-bold transition-colors flex items-center md:gap-2">
              <span className="text-grecia-accent italic">Grecia</span>
              <span className="text-white hidden sm:inline">Fashion Store</span>
              <span className="text-white sm:hidden ml-1">Fashion</span>
            </span>
            <span className="text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-gray-400 mt-1 hidden sm:block">Boutique</span>
          </Link>

          {/* RIGHT: User Actions & Cart */}
          <div className="flex flex-1 justify-end items-center space-x-4 md:space-x-5">
            {userRole ? (
              <div className="flex items-center gap-4">
                {/* Desktop Welcome */}
                {userRole === "admin" ? (
                  <span className="text-white text-xs hidden lg:inline-block border border-gray-800 px-3 py-1 rounded">
                    Hola, <span className="text-grecia-accent font-bold">Admin</span>
                  </span>
                ) : (
                  <Link href="/user" className="text-white text-xs hidden lg:inline-block border border-gray-800 px-3 py-1 rounded hover:border-grecia-accent transition" title="Mi Dashboard">
                    Hola, <span className="font-bold capitalize">{user?.full_name || user?.email?.split('@')[0] || "Cliente"}</span> <i className="fas fa-chevron-right text-[10px] ml-1"></i>
                  </Link>
                )}

                {/* Account Links Dashboard - Hidden on Mobile */}
                {userRole === "admin" && (
                  <Link href="/admin" className="text-grecia-accent hover:text-white transition hidden md:flex text-sm items-center gap-1 bg-black/50 border border-gray-800 px-3 py-1 rounded-full cursor-pointer" title="Panel de Administrador">
                    <i className="fas fa-shield-alt text-xs"></i> Portal Admin
                  </Link>
                )}

                {userRole === "user" && (
                  <Link href="/user" className="text-gray-300 hover:text-white transition hidden md:flex text-sm items-center gap-1 bg-black/50 border border-gray-800 px-3 py-1 rounded-full cursor-pointer" title="Mi Panel">
                    <i className="fas fa-user-circle text-xs"></i> Mi Perfil
                  </Link>
                )}

                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition text-sm hidden md:flex flex items-center gap-1" title="Cerrar Sesión">
                  <i className="fas fa-sign-out-alt"></i>Salir
                </button>
              </div>
            ) : (
              <button onClick={() => setLoginModalOpen(true)} className="text-white hover:text-grecia-accent transition" title="Iniciar Sesión" aria-label="Iniciar sesión o crear cuenta">
                <i className="fas fa-user text-[1.35rem]" id="user-icon"></i>
              </button>
            )}

            {/* CART BUTTON: Ultra-visible on mobile */}
            <button
              className="text-white hover:text-grecia-accent transition relative flex items-center justify-center p-2 rounded-full cursor-pointer"
              onClick={() => setCartOpen(true)}
              aria-label="Abrir carrito de compras"
            >
              <i className="fas fa-shopping-bag text-2xl"></i>
              {cartCount > 0 && (
                <span id="cart-count" className="absolute -top-1 -right-1 bg-grecia-accent text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(221,167,165,0.6)] border border-black animate-pulse-slow">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`fixed inset-0 bg-black z-50 transform transition-transform duration-300 flex flex-col justify-center items-center space-y-8 md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <button className="absolute top-6 right-6 text-2xl text-white hover:text-grecia-accent" onClick={() => setMobileMenuOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
          <Link href="#home" className="text-2xl font-serif text-white hover:text-grecia-accent transition" onClick={() => setMobileMenuOpen(false)}>Inicio</Link>
          <Link href="#categories" className="text-2xl font-serif text-white hover:text-grecia-accent transition" onClick={() => setMobileMenuOpen(false)}>Líneas</Link>
          <Link href="#store" className="text-2xl font-serif text-white hover:text-grecia-accent transition" onClick={() => setMobileMenuOpen(false)}>Catálogo</Link>
          <Link href="#testimonials" className="text-2xl font-serif text-white hover:text-grecia-accent transition" onClick={() => setMobileMenuOpen(false)}>Reseñas</Link>
          <Link href="#visit-us" className="text-2xl font-serif text-white hover:text-grecia-accent transition" onClick={() => setMobileMenuOpen(false)}>Visítanos</Link>

          {userRole ? (
            <div className="flex flex-col items-center gap-6 mt-4">
              {userRole === "admin" ? (
                <Link href="/admin" className="text-xl font-serif text-grecia-accent hover:text-white transition border-b border-gray-800 pb-2 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <i className="fas fa-shield-alt"></i> Portal Admin
                </Link>
              ) : (
                <Link href="/user" className="text-xl font-serif text-white hover:text-grecia-accent transition border-b border-gray-800 pb-2 flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <i className="fas fa-user-circle"></i> Mi Perfil
                </Link>
              )}
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-lg font-serif text-red-500/80 hover:text-red-400 transition flex items-center gap-2">
                <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
              </button>
            </div>
          ) : (
            <button onClick={() => { setLoginModalOpen(true); setMobileMenuOpen(false); }} className="text-2xl font-serif text-gray-400 hover:text-grecia-accent transition border border-gray-800 rounded px-8 py-3 mt-4">
              Iniciar Sesión Libre
            </button>
          )}
        </div>
      </header >



      {/* Login Modals */}
      {
        loginModalOpen && (
          <div className="fixed inset-0 z-[60] popup-overlay flex items-center justify-center p-4">
            <div className="bg-grecia-card border border-gray-800 rounded-lg shadow-2xl max-w-sm w-full p-8 relative animate-slide-up">
              <button onClick={() => setLoginModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10 transition"><i className="fas fa-times text-xl"></i></button>
              <div className="text-center mb-6">
                <i className="fas fa-user-circle text-5xl text-white mb-4"></i>
                <h3 className="font-serif text-2xl font-bold text-white">
                  {isLoginMode ? "Bienvenido(a)" : "Crear Cuenta"}
                </h3>
                <p className="text-xs text-gray-400 mt-2">
                  {isLoginMode ? "Acceso seguro a clientes o administrador" : "Únete a nuestra exclusiva base de clientes"}
                </p>


              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {loginError && (
                  <div className={`border text-xs p-2 rounded text-center ${loginError.includes('exitoso') ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {loginError}
                  </div>
                )}
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded focus:outline-none focus:border-grecia-accent transition"
                />
                {!isLoginMode && (
                  <input
                    type="tel"
                    placeholder="Número de Teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded focus:outline-none focus:border-grecia-accent transition"
                  />
                )}
                <input
                  type="password"
                  placeholder="Contraseña segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded focus:outline-none focus:border-grecia-accent transition"
                />

                <div className="flex items-start gap-3 mt-4 bg-gray-900/40 p-3 rounded border border-gray-800">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 flex-shrink-0 w-4 h-4 accent-grecia-accent bg-black border-gray-700 rounded cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[10px] text-gray-400 leading-tight cursor-pointer">
                    Acepto los <a href="/terms" target="_blank" className="text-grecia-accent hover:underline">Términos y Condiciones</a>. Entiendo y estoy de acuerdo en que todas las compras realizadas en esta plataforma son estrictamente para <strong>recojo físico y presencial en la Boutique</strong> (Sin servicio de entrega a docimilio de terceros).
                  </label>
                </div>

                <button type="submit" className="w-full bg-grecia-accent text-white py-3 font-medium hover:bg-white hover:text-black transition shadow-[0_0_15px_rgba(255,42,122,0.4)] uppercase tracking-wider text-sm rounded mt-2">
                  {isLoginMode ? "Ingresar" : "Registrarse y Aceptar"}
                </button>
              </form>

              <div className="mt-4 mb-4 flex items-center justify-center">
                <div className="border-t border-gray-800 flex-grow"></div>
                <span className="mx-4 text-xs text-gray-500 uppercase">O continuar con</span>
                <div className="border-t border-gray-800 flex-grow"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white text-black py-3 font-medium hover:bg-gray-200 transition shadow-sm rounded flex items-center justify-center gap-2 mb-4"
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Google
              </button>

              <div className="text-center border-t border-gray-800 pt-4">
                <p className="text-xs text-gray-400">
                  {isLoginMode ? "¿No tienes cuenta? " : "¿Ya eres cliente? "}
                  <button
                    onClick={() => { setIsLoginMode(!isLoginMode); setLoginError(""); }}
                    className="text-grecia-accent font-bold hover:underline"
                  >
                    {isLoginMode ? "Regístrate aquí" : "Inicia Sesión"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Componentes Flotantes */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      {/* <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} /> */}
    </>
  );
}
