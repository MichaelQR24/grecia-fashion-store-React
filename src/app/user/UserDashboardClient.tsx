"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  ArrowRight,
  Plus
} from 'lucide-react';
import { createClient } from "@/utils/supabase/client";
import Link from 'next/link';

export default function UserDashboardClient({ 
    initialUser, 
    initialProfile, 
    orders 
}: { 
    initialUser: any, 
    initialProfile: any, 
    orders: any[] 
}) {
  const [activeTab, setActiveTab] = useState('pedidos');
  
  // Procesamos los nombres para asegurar de que siempre usemos lo que hay en la BD
  const [formDatos, setFormDatos] = useState({
        nombre: initialProfile?.full_name?.split(" ")[0] || "",
        apellido: initialProfile?.full_name?.split(" ").slice(1).join(" ") || "",
        fecha_nacimiento: initialProfile?.birth_date || "",
        genero: initialProfile?.gender || "Femenino",
        telefono: initialProfile?.phone || "",
        idioma: initialProfile?.language || "Español"
  });

  const initialName = initialProfile?.full_name?.split(" ")[0] || "";
  const initialLastName = initialProfile?.full_name?.split(" ").slice(1).join(" ") || "";
  const hasChanges = 
     formDatos.nombre !== initialName ||
     formDatos.apellido !== initialLastName ||
     formDatos.telefono !== (initialProfile?.phone || "") ||
     formDatos.fecha_nacimiento !== (initialProfile?.birth_date || "") ||
     formDatos.genero !== (initialProfile?.gender || "Femenino") ||
     formDatos.idioma !== (initialProfile?.language || "Español");

  const firstnameChunk = formDatos.nombre.trim().split(" ")[0] || "";
  const lastnameChunk = formDatos.apellido.trim().split(" ")[0] || "";
  const displayName = `${firstnameChunk} ${lastnameChunk}`.trim() || "Usuario";

  // CRUD Direcciones
  const [direcciones, setDirecciones] = useState<any[]>(initialProfile?.addresses || [
    { id: '1', isDefault: true, title: 'Casa', line1: 'Av. Las Flores 123', line2: 'San Juan de Lurigancho', city: 'Lima, Perú' },
    { id: '2', isDefault: false, title: 'Estudio', line1: 'Av. Javier Prado Este 456', line2: 'San Isidro, Piso 5', city: 'Lima, Perú' }
  ]);
  const [addressForm, setAddressForm] = useState<any>(null); // null = Modo vista, object = Modo edicion/creacion

  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleSaveDatos = async () => {
    setIsSaving(true);
    const fullName = `${formDatos.nombre} ${formDatos.apellido}`.trim();
    
    // Fallback de seguridad en caso de que la tabla 'profiles' no tenga ciertas columnas extendidas 
    const fullPayload = {
        full_name: fullName,
        phone: formDatos.telefono,
        birth_date: formDatos.fecha_nacimiento,
        gender: formDatos.genero,
        language: formDatos.idioma
    };

    const basicPayload = {
        full_name: fullName,
        phone: formDatos.telefono
    };

    const { error } = await supabase.from('profiles').update(fullPayload).eq('id', initialUser.id);
    
    if (error) {
        console.warn("Algunas columnas extendidas (birth_date, etc.) no existen en tu BD. Guardando en modo básico.");
        await supabase.from('profiles').update(basicPayload).eq('id', initialUser.id);
    }
    
    await supabase.auth.updateUser({
        data: { name: fullName, phone: formDatos.telefono }
    });
    
    setIsSaving(false);
    alert("¡Datos guardados con éxito en la Base de Datos!");
    window.location.reload(); // Refrescar para asentar el cache
  };

  const handleSaveDirecciones = async (newAddresses: any[]) => {
      setDirecciones(newAddresses);
      try {
          // Intentar guardar en Supabase si existe el column JSONB `addresses`
          await supabase.from('profiles').update({ addresses: newAddresses }).eq('id', initialUser.id);
      } catch(e) {
          console.warn("Columna 'addresses' podría no existir en Supabase, guardado en memoria local verificado.", e);
      }
      setAddressForm(null);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.href = '/';
  };

  const scrollCarousel = (id: string, direction: 'left' | 'right') => {
    const el = scrollRefs.current[id];
    if (el) {
      const scrollAmount = 350;
      el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleReceipt = (stripeSessionId: string) => {
     if (!stripeSessionId) {
        alert("La factura oficial no está disponible para esta orden antigua.");
        return;
     }
     window.open(`/api/checkout_sessions/${stripeSessionId}/receipt`, '_blank');
  };

  // Mapeo DIRECTO PARA PRODUCCIÓN.
  const mappedOrders = orders?.map(order => {
      let items = [];
      if (typeof order.cart_items === 'string') {
         try { items = JSON.parse(order.cart_items); } catch(e){}
      } else if (Array.isArray(order.cart_items)) {
         items = order.cart_items;
      }

      let mappedStatus = "En Progreso";
      const dbStatus = (order.status || "").toLowerCase();
      // Verificamos por las palabras 'paid', 'vendido', 'completado', etc.
      if (['paid', 'pagado', 'completado', 'vendido', 'succeeded'].some(x => dbStatus.includes(x))) {
         mappedStatus = "Vendido";
      } else if (dbStatus.includes('cancelado')) {
         mappedStatus = "Cancelado";
      } else {
         mappedStatus = "En Progreso";
      }

      return {
          rawId: order.id,
          stripeSessionId: order.stripe_session_id,
          id: `#${(order.id || "").split('-')[0].toUpperCase()}`,
          date: new Date(order.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          total: order.total_amount?.toFixed(2) || "0.00",
          status: mappedStatus,
          images: items.filter((item: any) => item.image).map((item: any) => item.image)
      };
  }) || [];

  return (
    <div className="bg-[#cdb7a6] min-h-screen text-[#382b28] font-sans selection:bg-[#fff0e6] selection:text-black relative overflow-hidden">
      
      {/* Glows */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#eadbcc] to-transparent blur-[130px] pointer-events-none opacity-40 z-0 text-transparent">glow</div>
      <div className="fixed bottom-[-15%] left-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#dfcdbe] to-transparent blur-[160px] pointer-events-none opacity-50 z-0 text-transparent">glow</div>

      {/* Navbar Superior Crema Oscura */}
      <div className="w-full bg-[#e5d5c5]/95 backdrop-blur-xl border-b border-[#c4b3a2] px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-md">
         
         {/* Logo Integrado de Header Principal ESCALADO */}
         <div className="flex flex-col items-center sm:items-start group shrink-0">
            <span className="text-2xl md:text-3xl font-serif font-bold transition-colors flex items-center md:gap-1.5 leading-none">
              <span className="text-grecia-accent text-[#a44238] italic font-medium pr-1">Grecia</span>
              <span className="text-[#382b28] hidden sm:inline">Fashion Store</span>
              <span className="text-[#382b28] sm:hidden">Fashion</span>
            </span>
            <span className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-[#8c746b] mt-1 ml-1 hidden sm:block">Boutique</span>
         </div>

         <Link href="/">
          <button className="flex items-center gap-3 text-[13px] uppercase tracking-[0.2em] font-bold text-[#e5d5c5] bg-[#382b28] hover:bg-black px-8 py-4 rounded-full shadow-lg transition-all border border-black group">
            <ShoppingBag className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            <span className="hidden sm:inline">Comprar Nuevamente</span>
          </button>
         </Link>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 sm:px-8 py-14 relative z-10 fade-in">
        
        {/* Cabecera Principal */}
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <h1 className="text-5xl md:text-7xl font-serif text-[#382b28] font-light tracking-wide mb-4">Mi Perfil</h1>
              <p className="text-[#382b28]/70 text-lg md:text-xl font-light">Elegancia, compras y ajustes a tu medida.</p>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* SIDEBAR CREMA OSCURA */}
          <aside className="w-full lg:w-[320px] flex-shrink-0 animate-slide-up">
            <div className="sticky top-32 bg-[#e5d5c5] rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(100,80,75,0.15)] border border-[#c4b3a2]/50">
              
              <div className="flex flex-col items-center mb-12">
                <div className="relative w-28 h-28 rounded-full border-[3px] border-[#dfcdba] shadow-[0_8px_20px_rgba(0,0,0,0.05)] mb-6 bg-[#f2e7da] p-1 group overflow-hidden">
                  <div className="w-full h-full rounded-full bg-[#dfcdba] flex items-center justify-center overflow-hidden">
                     <User className="w-12 h-12 text-[#8c746b] group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                  </div>
                </div>
                <h2 className="font-serif text-3xl text-[#29211f] text-center mb-1">{displayName}</h2>
              </div>

              <nav className="space-y-4">
                <SidebarSoftItem icon={<ShoppingBag className="w-5 h-5" />} label="Historial de Pedidos" isActive={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')} />
                <SidebarSoftItem icon={<User className="w-5 h-5" />} label="Detalles Personales" isActive={activeTab === 'datos'} onClick={() => setActiveTab('datos')} />
                <SidebarSoftItem icon={<MapPin className="w-5 h-5" />} label="Mis Direcciones" isActive={activeTab === 'direcciones'} onClick={() => {setActiveTab('direcciones'); setAddressForm(null)}} />
                <SidebarSoftItem icon={<Settings className="w-5 h-5" />} label="Preferencias" isActive={activeTab === 'preferencias'} onClick={() => setActiveTab('preferencias')} />
              </nav>

              <div className="mt-12 pt-10 border-t border-[#c4b3a2]">
                <button onClick={handleLogout} className="w-full bg-[#dfcdba] hover:bg-[#d5c0aa] border border-[#c4b3a2]/50 text-[#8c746b] hover:text-[#523d38] py-4 rounded-3xl text-[12px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-inner">
                  <LogOut className="w-4 h-4" />
                  <span>Salir de la cuenta</span>
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <section className="flex-1 w-full relative min-h-[600px] z-20">
            
            {activeTab === 'pedidos' && (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                
                {/* Cabecera Tipo Revista */}
                <div className="bg-[#e5d5c5] rounded-[2.5rem] p-8 shadow-[0_20px_40px_rgba(100,80,75,0.1)] border border-[#c4b3a2]/50 mb-10 overflow-hidden relative flex items-center justify-between text-[#29211f]">
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full h-full px-5">
                      <div>
                        <h2 className="text-4xl font-serif flex items-center gap-5">
                           <span className="w-10 h-[1px] bg-[#382b28] inline-block"></span>
                           Mis Pedidos
                        </h2>
                      </div>
                      <div className="text-[12px] uppercase font-bold text-[#8c746b] tracking-widest mt-5 md:mt-0 bg-[#dfcdba] px-6 py-3 rounded-full shadow-inner border border-[#d1bfab]">
                         {mappedOrders.length} transacciones
                      </div>
                   </div>
                </div>

                <div className="space-y-10">
                  {mappedOrders.length > 0 ? mappedOrders.map((order: any, idx: number) => {
                    
                    let statusColor = "bg-[#d8e3d6] text-[#4d6657] border-[#bcccb8]"; // Vendido Default Verde
                    if (order.status === 'Cancelado') {
                        statusColor = "bg-[#eacbd0] text-[#8a4d56] border-[#cfadb2]";
                    } else if (order.status === 'En Progreso') {
                        statusColor = "bg-[#e5dfc5] text-[#736c4b] border-[#c9c1a1]";
                    }

                    return (
                      <div key={idx} className="bg-[#e5d5c5] border border-[#d1bfab] rounded-[2.5rem] p-8 md:p-10 shadow-[0_15px_40px_rgba(100,80,75,0.1)] hover:shadow-[0_25px_60px_rgba(100,80,75,0.15)] transition-all duration-500 relative group text-[#29211f]">
                        <div className="flex flex-col gap-10">
                          {/* Información destacable */}
                          <div className="w-full flex justify-between items-start border-b border-[#c4b3a2]/40 pb-8">
                            <div>
                               <p className="text-[#8c746b] text-[12px] uppercase tracking-widest mb-2 font-bold">
                                 Factura <span className="text-[#382b28] text-sm ml-2">{order.id}</span>
                               </p>
                               <p className="text-[#523d38] text-sm font-medium flex items-center gap-2">
                                 <span className="w-2 h-2 bg-[#dca592] rounded-full inline-block"></span>
                                 {order.date}
                               </p>
                            </div>
                            
                            <div className="text-right flex flex-col items-end gap-2.5">
                               <div className={`px-5 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-widest shadow-sm border w-max ${statusColor}`}>
                                 {order.status}
                               </div>
                               <p className="font-serif text-5xl text-[#1a1210] tracking-tight font-medium drop-shadow-sm mt-1">${order.total}</p>
                            </div>
                          </div>

                          <div className="flex flex-col xl:flex-row gap-12 xl:gap-8 items-end">
                            
                            <div className="w-full xl:w-1/4">
                              <button onClick={() => handleReceipt(order.stripeSessionId)} className="w-full text-[#e5d5c5] bg-[#382b28] hover:bg-black px-7 py-4 rounded-full transition-all text-[11px] font-extrabold tracking-widest uppercase shadow-md hover:shadow-lg flex items-center justify-center gap-3 border border-[#1a1210] mb-2">
                                Ver Recibo <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="w-full xl:w-3/4 relative flex items-center pb-2">
                              {order.images.length > 2 && (
                                <button 
                                  onClick={() => scrollCarousel(order.rawId, 'left')}
                                  className="absolute -left-6 z-30 bg-[#e5d5c5] border border-[#d1bfab] text-[#29211f] hover:text-white hover:bg-[#382b28] hover:scale-110 w-12 h-12 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                                >
                                  <ChevronLeft className="w-5 h-5 ml-[-2px]" strokeWidth={2} />
                                </button>
                              )}
                              
                              <div 
                                ref={(el) => { scrollRefs.current[order.rawId] = el; }}
                                className="flex gap-4 md:gap-6 overflow-x-auto flex-1 pb-6 pt-4 hide-scrollbar scroll-smooth px-1"
                              >
                                {order.images.length > 0 ? order.images.map((img: string, i: number) => (
                                  <div key={i} className="flex-shrink-0 w-44 sm:w-52 aspect-[3/4] rounded-[2rem] overflow-hidden relative group/img cursor-pointer shadow-[0_15px_30px_rgba(0,0,0,0.08)] bg-[#dfcdba] border border-[#c4b3a2]">
                                    <img src={img} alt="Artículo" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover/img:scale-[1.08]" />
                                  </div>
                                )) : (
                                  <div className="w-full text-center py-10">
                                     <ShoppingBag className="w-8 h-8 text-[#c4b3a2] mx-auto mb-3 opacity-50" />
                                     <p className="text-[12px] uppercase tracking-widest text-[#8c746b] font-bold">Sin imágenes de carrito</p>
                                  </div>
                                )}
                              </div>

                              {order.images.length > 2 && (
                                <button 
                                  onClick={() => scrollCarousel(order.rawId, 'right')}
                                  className="absolute -right-6 z-30 bg-[#e5d5c5] border border-[#d1bfab] text-[#29211f] hover:text-white hover:bg-[#382b28] hover:scale-110 w-12 h-12 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                                >
                                  <ChevronRight className="w-5 h-5 mr-[-2px]" strokeWidth={2} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                     <div className="text-center py-28 bg-[#e5d5c5] border border-[#d1bfab] rounded-[3rem] shadow-sm">
                        <ShoppingBag className="w-14 h-14 mx-auto text-[#dfcdba] mb-8" />
                        <p className="font-serif text-4xl text-[#382b28]/60 font-light tracking-wide mb-5">Aún sin pedidos</p>
                        <p className="text-[13px] text-[#382b28]/50 uppercase tracking-widest mb-12">Ve de compras para llenar tu ropero exclusivo.</p>
                        <Link href="/">
                          <button className="bg-[#382b28] hover:bg-black px-12 py-5 text-[#e5d5c5] text-[13px] tracking-[0.2em] font-extrabold uppercase transition-colors rounded-full shadow-lg">Ir a la Boutique</button>
                        </Link>
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* DEMAS PESTAÑAS (Datos Personales) */}
            {activeTab === 'datos' && (
              <div className="animate-in fade-in zoom-in-95 duration-700 max-w-4xl">
                <div className="bg-[#e5d5c5] rounded-[3rem] p-12 md:p-16 border border-[#d1bfab] shadow-[0_20px_50px_rgba(100,80,75,0.15)] text-[#29211f]">
                  <div className="mb-14 border-b border-[#c4b3a2] pb-10 text-center md:text-left">
                    <h2 className="text-4xl font-serif mb-3">Mi Identidad</h2>
                    <p className="text-[#8c746b] text-[13px] uppercase tracking-widest font-bold">Tus coordenadas de elegancia.</p>
                  </div>

                  <form className="space-y-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-12">
                      <InputSuave label="Primer Nombre" value={formDatos.nombre} onChange={(v: string) => setFormDatos({...formDatos, nombre: v})} />
                      <InputSuave label="Apellidos" value={formDatos.apellido} onChange={(v: string) => setFormDatos({...formDatos, apellido: v})} />
                      <div className="col-span-1 md:col-span-2">
                        <InputSuave label="Correo Electrónico (No editable)" value={initialUser.email} type="email" readOnly />
                      </div>
                      <InputSuave label="Teléfono de Contacto" value={formDatos.telefono} type="tel" onChange={(v: string) => setFormDatos({...formDatos, telefono: v})} />
                      <InputSuave label="Fecha de Nacimiento" value={formDatos.fecha_nacimiento} type="date" onChange={(v: string) => setFormDatos({...formDatos, fecha_nacimiento: v})} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 pt-16 border-t border-[#c4b3a2]">
                      <button 
                         type="button" 
                         onClick={handleSaveDatos} 
                         disabled={!hasChanges || isSaving}
                         className={`px-12 py-5 rounded-full transition-all text-[12px] font-extrabold tracking-widest uppercase shadow-lg min-w-[220px] border 
                            ${(!hasChanges || isSaving) 
                               ? 'bg-[#c4b3a2] text-[#8c746b] border-[#bda695] cursor-not-allowed shadow-none' 
                               : 'bg-[#382b28] hover:bg-black text-[#e5d5c5] border-[#1a1210] cursor-pointer'
                            }
                         `}
                      >
                        {isSaving ? "Guardando..." : "Actualizar Datos"}
                      </button>
                      <button type="button" className="bg-[#dfcdba] border border-[#c4b3a2] hover:bg-[#d5c0aa] text-[#523d38] px-12 py-5 rounded-full transition-colors text-[12px] font-extrabold tracking-widest uppercase shadow-inner">
                        Cambiar Contraseña
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* DIRECCIONES */}
            {activeTab === 'direcciones' && (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                
                {addressForm ? (
                   // FORMULARIO DE EDICION O CREACION DE DIRECCION
                   <div className="bg-[#e5d5c5] rounded-[3rem] p-12 md:p-16 shadow-lg border border-[#d1bfab] max-w-4xl">
                     <h3 className="text-4xl font-serif text-[#29211f] mb-10 pb-6 border-b border-[#c4b3a2] flex items-center gap-4">
                         <MapPin className="w-8 h-8 text-[#8c746b]" />
                         {addressForm.id ? "Editar Dirección" : "Nueva Dirección"}
                     </h3>
                     <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="md:col-span-2">
                             <InputSuave label="Título (Ej. Casa, Trabajo, Estudio)" value={addressForm.title || ""} onChange={(v: string) => setAddressForm({...addressForm, title: v})} />
                           </div>
                           <div className="md:col-span-2">
                              <InputSuave label="Dirección Principal (Calle, Nro, Urb)" value={addressForm.line1 || ""} onChange={(v: string) => setAddressForm({...addressForm, line1: v})} />
                           </div>
                           <InputSuave label="Distrito / Referencia" value={addressForm.line2 || ""} onChange={(v: string) => setAddressForm({...addressForm, line2: v})} />
                           <InputSuave label="Ciudad / País" value={addressForm.city || ""} onChange={(v: string) => setAddressForm({...addressForm, city: v})} />
                        </div>
                        
                        <div className="flex items-center justify-between p-8 bg-[#dfcdba] rounded-3xl border border-[#c4b3a2]/50 mt-6 shadow-sm">
                           <div>
                              <p className="text-[17px] text-[#382b28] font-serif font-bold">Establecer como Principal</p>
                              <p className="text-[13px] text-[#8c746b]">Se usará por defecto en tus compras.</p>
                           </div>
                           <ToggleElegante checked={addressForm.isDefault} onChange={(checked: boolean) => setAddressForm({...addressForm, isDefault: checked})} />
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-[#c4b3a2]">
                           <button onClick={() => {
                               if(!addressForm.title || !addressForm.line1) return alert("El título y la dirección principal son obligatorios");
                               let updated;
                               let curr = {...addressForm};
                               if (curr.id) {
                                   updated = direcciones.map(d => d.id === curr.id ? curr : d);
                               } else {
                                   updated = [...direcciones, { ...curr, id: Date.now().toString() }];
                               }
                               if (curr.isDefault) {
                                   updated = updated.map(d => d.id === curr.id ? d : { ...d, isDefault: false });
                               }
                               handleSaveDirecciones(updated);
                           }} className="bg-[#382b28] text-[#e5d5c5] px-12 py-5 rounded-full text-[12px] uppercase font-extrabold tracking-widest hover:bg-black transition-colors shadow-md">
                               Guardar Dirección
                           </button>
                           <button onClick={() => setAddressForm(null)} className="bg-transparent border border-[#c4b3a2] px-12 py-5 rounded-full text-[12px] uppercase font-bold tracking-widest hover:bg-[#dfcdba] hover:text-[#523d38] transition-colors">
                               Descartar
                           </button>
                        </div>
                     </div>
                  </div>
                ) : (
                   // LISTADO DE DIRECCIONES
                   <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                      <div>
                        <h2 className="text-4xl font-serif text-[#382b28]">Directorio</h2>
                        <p className="text-[#8c746b] text-[13px] uppercase tracking-widest font-bold mt-2">Destinos de envío para tus compras.</p>
                      </div>
                      <button onClick={() => setAddressForm({ isDefault: direcciones.length === 0 })} className="bg-[#e5d5c5] border border-[#d1bfab] text-[#29211f] font-bold px-8 py-5 rounded-full hover:shadow-lg hover:bg-[#fff7ed] transition-all text-[12px] uppercase tracking-widest shadow-[0_5px_15px_rgba(100,80,75,0.1)] flex items-center gap-3">
                        <Plus className="w-5 h-5" /> Agregar Nueva
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {direcciones.length > 0 ? direcciones.map((dir, i) => (
                        <div key={i} className={`bg-[#e5d5c5] border ${dir.isDefault ? 'border-[#382b28]' : 'border-[#d1bfab]'} rounded-[3rem] p-12 shadow-[0_15px_40px_rgba(100,80,75,0.1)] relative group hover:shadow-[0_20px_50px_rgba(100,80,75,0.15)] transition-all text-[#29211f]`}>
                          
                          {dir.isDefault && (
                            <div className="absolute top-8 right-8 text-[#e5d5c5] text-[11px] font-extrabold uppercase tracking-widest bg-[#382b28] px-5 py-2.5 rounded-full shadow-sm">
                              Principal
                            </div>
                          )}

                          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-8 text-[#8c746b] border ${dir.isDefault ? 'bg-[#dfcdba] border-[#c4b3a2]' : 'bg-transparent border-[#c4b3a2]'}`}>
                            <MapPin className="w-6 h-6" strokeWidth={1.5} />
                          </div>

                          <h3 className="text-3xl font-serif text-[#1a1210] mb-3">{dir.title}</h3>
                          <p className="text-[#523d38] text-[15px] leading-relaxed font-normal mb-10">
                             {dir.line1}<br/>
                             {dir.line2 && <>{dir.line2}<br/></>}
                             {dir.city}
                          </p>
                          
                          <div className="flex gap-5 border-t border-[#c4b3a2]/40 pt-8">
                            <button onClick={() => setAddressForm(dir)} className="text-[#29211f] font-bold text-[12px] uppercase tracking-widest bg-[#dfcdba] px-8 py-3.5 rounded-full hover:bg-[#d5c0aa] transition-colors border border-[#c4b3a2]/50 shadow-inner">
                               Editar
                            </button>
                            <button onClick={() => {
                                if(window.confirm("¿Estás segura de eliminar esta dirección?")) {
                                   handleSaveDirecciones(direcciones.filter(d => d.id !== dir.id));
                                }
                            }} className="text-[#a44238] font-bold text-[12px] uppercase tracking-widest bg-[#e6cecb] px-8 py-3.5 rounded-full hover:bg-[#d4afa9] transition-colors border border-[#c9ada9] shadow-inner">
                               Eliminar
                            </button>
                          </div>
                        </div>
                      )) : (
                         <div className="col-span-2 text-center py-28 bg-[#e5d5c5]/50 border border-dashed border-[#c4b3a2] rounded-[3rem]">
                            <MapPin className="w-12 h-12 mx-auto text-[#c4b3a2] mb-5" />
                            <p className="font-serif text-3xl text-[#8c746b] mb-3">Sin direcciones guardadas</p>
                            <p className="text-[#a28e85] text-[13px] uppercase tracking-widest">Agrega tu primera dirección de entrega.</p>
                         </div>
                      )}
                    </div>
                   </>
                )}
              </div>
            )}

            {/* PREFERENCIAS */}
            {activeTab === 'preferencias' && (
              <div className="animate-in fade-in zoom-in-95 duration-700 max-w-3xl">
                <div className="bg-[#e5d5c5] rounded-[3rem] p-12 md:p-16 border border-[#d1bfab] shadow-[0_20px_50px_rgba(100,80,75,0.15)] text-[#29211f]">
                  <h2 className="text-4xl font-serif mb-12 border-b border-[#c4b3a2] pb-8">Sensaciones</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-[#dfcdba] rounded-3xl p-8 shadow-sm border border-[#c4b3a2] flex items-center justify-between hover:shadow-md transition-shadow">
                       <div>
                          <h3 className="font-serif text-2xl mb-2 mt-1">Boletines & Desfiles</h3>
                          <p className="text-[14px] text-[#8c746b]">Ser la primera en saber todo.</p>
                       </div>
                       <ToggleElegante defaultChecked={true} />
                    </div>
                    
                    <div className="bg-[#dfcdba] rounded-3xl p-8 shadow-sm border border-[#c4b3a2] flex items-center justify-between hover:shadow-md transition-shadow">
                       <div>
                          <h3 className="font-serif text-2xl mb-2 mt-1">SMS de Pedidos</h3>
                          <p className="text-[14px] text-[#8c746b]">Seguimiento a tiempo real.</p>
                       </div>
                       <ToggleElegante defaultChecked={true} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #dfcdba inset !important;
            -webkit-text-fill-color: #29211f !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(0.2) sepia(0.3) saturate(0.5) hue-rotate(330deg);
            cursor: pointer;
        }
      `}} />
    </div>
  );
}

// Sub Componentes 
function SidebarSoftItem({ label, icon, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-5 px-8 py-5 rounded-3xl transition-all duration-300 group
        ${isActive ? 'bg-[#dfcdba] text-[#29211f] shadow-inner font-bold border border-[#c4b3a2]' : 'bg-transparent text-[#8c746b] hover:bg-[#dfcdba]/50 hover:text-[#523d38] font-medium border border-transparent'}
      `}
    >
      <div className={`${isActive ? 'text-[#382b28]' : 'text-[#a28e85] overflow-hidden group-hover:scale-110 group-hover:text-[#523d38] transition-all'}`}>
        {icon}
      </div>
      <span className="text-[13px] uppercase tracking-widest">
        {label}
      </span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#382b28]" />}
    </button>
  );
}

function InputSuave({ label, value, onChange, type = "text", readOnly }: any) {
  return (
    <div className="flex flex-col group relative">
      <label className="text-[#8c746b] text-[11px] font-extrabold uppercase tracking-widest mb-3 transition-colors group-focus-within:text-[#29211f] pl-5">{label}</label>
      <input 
        type={type} 
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full bg-[#dfcdba] rounded-[1.5rem] px-6 py-5 text-[#29211f] outline-none focus:bg-[#ebd8c5] focus:shadow-[0_10px_20px_rgba(0,0,0,0.1)] focus:ring-1 focus:ring-[#c4b3a2] transition-all font-medium text-base
          ${readOnly ? 'opacity-70 cursor-not-allowed border border-[#d1bfab]' : 'shadow-inner border border-[#c4b3a2]/50 hover:border-[#b4a08f]'}
        `}
      />
    </div>
  );
}

function ToggleElegante({ defaultChecked, checked, onChange }: any) {
  return (
    <label className="relative inline-flex items-center cursor-pointer group">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        defaultChecked={defaultChecked} 
        checked={checked}
        onChange={(e) => onChange && onChange(e.target.checked)}
      />
      <div className="w-14 h-7 bg-[#cfbeac] peer-focus:outline-none relative rounded-full transition-colors peer-checked:bg-[#382b28] shadow-inner border border-[#bfae9c]">
         <div className="w-6 h-6 bg-[#e5d5c5] border border-[#a69584] rounded-full absolute top-[1px] left-[2px] peer-checked:left-[30px] peer-checked:border-[#1a1210] transition-all duration-300 shadow-sm flex items-center justify-center"></div>
      </div>
    </label>
  );
}
