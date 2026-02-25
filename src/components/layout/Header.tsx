"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import CartSidebar from "@/components/cart/CartSidebar";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
  const router = useRouter();
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Estados Globales Simulación Login y Carrito
  const { userRole, setUserRole, cart } = useAppContext();

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const endpoint = isLoginMode ? "/api/auth" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (!isLoginMode) {
          // Registro exitoso, pasar a modo login
          setLoginError("✅ ¡Registro exitoso! Ya puedes iniciar sesión.");
          setIsLoginMode(true);
          return;
        }

        // Login Exitoso
        setUserRole(data.role); // 'admin' o 'user' según lo que devuelva
        setLoginModalOpen(false);
        setEmail("");
        setPassword("");

        // Redirección Automática
        if (data.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/user');
        }
      } else {
        setLoginError(data.message || "Credenciales incorrectas.");
      }
    } catch {
      setLoginError("Error conectando con el servidor de autenticación.");
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
      await fetch("/api/auth/logout", { method: "POST" });
      setUserRole(null);
    } catch {
      console.error("Error cerrando sesión");
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
        <div className={`container mx-auto px-6 transition-all duration-500 flex items-center justify-between ${isScrolled ? "py-3" : "py-5"}`}>
          <button className="md:hidden text-white text-xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <i className="fas fa-bars"></i>
          </button>

          <Link href="/" className="flex flex-col items-center group">
            <span className="text-2xl md:text-3xl font-serif font-bold transition-colors flex items-center gap-2">
              <span className="text-grecia-accent italic">Grecia</span>
              <span className="text-white">Fashion Store</span>
            </span>
            <span className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-gray-400 mt-1">Boutique</span>
          </Link>

          <nav className="hidden md:flex space-x-8 items-center">
            <Link href="#categories" className="text-xs font-semibold text-gray-300 hover:text-grecia-accent tracking-widest uppercase transition">Líneas</Link>
            <Link href="#store" className="text-xs font-semibold text-grecia-accent hover:text-white tracking-widest uppercase transition">Catálogo</Link>
            <Link href="#testimonials" className="text-xs font-semibold text-gray-300 hover:text-grecia-accent tracking-widest uppercase transition">Reseñas</Link>
            <Link href="#visit-us" className="text-xs font-semibold text-gray-300 hover:text-grecia-accent tracking-widest uppercase transition">Visítanos</Link>
          </nav>

          <div className="flex items-center space-x-5">
            {userRole ? (
              <div className="flex items-center gap-4">
                {userRole === "admin" ? (
                  <span className="text-white text-xs hidden md:inline-block border border-gray-800 px-3 py-1 rounded">
                    Hola, <span className="text-grecia-accent font-bold">Admin</span>
                  </span>
                ) : (
                  <Link href="/user" className="text-white text-xs hidden md:inline-block border border-gray-800 px-3 py-1 rounded hover:border-grecia-accent transition" title="Mi Dashboard">
                    Hola, <span className="font-bold">Cliente</span> <i className="fas fa-chevron-right text-[10px] ml-1"></i>
                  </Link>
                )}

                {userRole === "admin" && (
                  <Link href="/admin" className="text-grecia-accent hover:text-white transition text-sm flex items-center gap-1 bg-black/50 border border-gray-800 px-3 py-1 rounded-full cursor-pointer" title="Panel de Administrador">
                    <i className="fas fa-shield-alt text-xs"></i> Portal Admin
                  </Link>
                )}

                {userRole === "user" && (
                  <Link href="/user" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-1 bg-black/50 border border-gray-800 px-3 py-1 rounded-full cursor-pointer" title="Mi Panel">
                    <i className="fas fa-user-circle text-xs"></i> Mi Perfil
                  </Link>
                )}

                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition text-sm flex items-center gap-1" title="Cerrar Sesión">
                  <i className="fas fa-sign-out-alt"></i>Salir
                </button>
              </div>
            ) : (
              <button onClick={() => setLoginModalOpen(true)} className="text-white hover:text-grecia-accent transition" title="Iniciar Sesión">
                <i className="fas fa-user text-xl" id="user-icon"></i>
              </button>
            )}

            <button className="text-white hover:text-grecia-accent transition relative group" onClick={() => setCartOpen(true)}>
              <i className="fas fa-shopping-bag text-xl"></i>
              {cartCount > 0 && (
                <span id="cart-count" className="absolute -top-1 -right-2 bg-grecia-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center transform group-hover:scale-110 transition">
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

                <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-800 text-left">
                  <p className="text-[10px] text-gray-400 mb-1 font-bold">INFO DE SEGURIDAD:</p>
                  <p className="text-[10px] text-gray-500">🔒 Esta app ahora usa Criptografía Real de <span className="text-grecia-accent">Supabase Auth</span>.</p>
                  <p className="text-[10px] text-gray-500 mt-1">📧 El correo "admin@grecia.com" posee privilegios totales. Los demás correos registrados son clientes.</p>
                </div>
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
                <input
                  type="password"
                  placeholder="Contraseña segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black border border-gray-800 text-white px-4 py-3 rounded focus:outline-none focus:border-grecia-accent transition"
                />
                <button type="submit" className="w-full bg-grecia-accent text-white py-3 font-medium hover:bg-white hover:text-black transition shadow-[0_0_15px_rgba(255,42,122,0.4)] uppercase tracking-wider text-sm rounded mt-2">
                  {isLoginMode ? "Ingresar" : "Registrarse"}
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
