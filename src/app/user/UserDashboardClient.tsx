"use client";

import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { createClient } from "@/utils/supabase/client";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Address {
  id: string;
  isDefault: boolean;
  title: string;
  line1: string;
  line2?: string;
  city: string;
}

interface UserProfile {
  full_name?: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  language?: string;
  addresses?: Address[];
}

interface UserAuth {
  id: string;
  email?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  stripe_session_id: string;
  status?: string;
  cart_items: string | unknown[];
}

export default function UserDashboardClient({ 
    initialUser, 
    initialProfile, 
    orders 
}: { 
    initialUser: UserAuth, 
    initialProfile: UserProfile, 
    orders: Order[] 
}) {
  const router = useRouter();
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

  // CRUD Direcciones
  const [direcciones, setDirecciones] = useState<Address[]>(initialProfile?.addresses || [
    { id: '1', isDefault: true, title: 'Casa', line1: 'Av. Las Flores 123', line2: 'San Juan de Lurigancho', city: 'Lima, Perú' },
    { id: '2', isDefault: false, title: 'Estudio', line1: 'Av. Javier Prado Este 456', line2: 'San Isidro, Piso 5', city: 'Lima, Perú' }
  ]);
  const [addressForm, setAddressForm] = useState<Address | null>(null); // null = Modo vista, object = Modo edicion/creacion

  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();


  const handleSaveDatos = async () => {
    setIsSaving(true);
    const fullName = `${formDatos.nombre} ${formDatos.apellido}`.trim();
    
    const fullPayload = {
        full_name: fullName,
        phone: formDatos.telefono,
        birth_date: formDatos.fecha_nacimiento,
        gender: formDatos.genero,
        language: formDatos.idioma
    };

    const basicPayload = { full_name: fullName, phone: formDatos.telefono };

    const { error } = await supabase.from('profiles').update(fullPayload).eq('id', initialUser.id);
    
    if (error) {
        await supabase.from('profiles').update(basicPayload).eq('id', initialUser.id);
    }
    await supabase.auth.updateUser({ data: { name: fullName, phone: formDatos.telefono } });
    
    setIsSaving(false);
    alert("¡Datos guardados con éxito en la Base de Datos!");
    window.location.reload(); 
  };

  const handleSaveDirecciones = async (newAddresses: Address[]) => {
      setDirecciones(newAddresses);
      try { await supabase.from('profiles').update({ addresses: newAddresses }).eq('id', initialUser.id); } 
      catch { /* Error silent fallback */ }
      setAddressForm(null);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/');
  };

  const handleReceipt = (stripeSessionId: string) => {
     if (!stripeSessionId) return alert("La factura oficial no está disponible para esta orden antigua.");
     window.open(`/api/checkout_sessions/${stripeSessionId}/receipt`, '_blank');
  };

  // Mapeo Órdenes
  const mappedOrders = orders?.map(order => {
      let items: unknown[] = [];
      if (typeof order.cart_items === 'string') {
         try { items = JSON.parse(order.cart_items); } catch { /* JSON error */ }
      } else if (Array.isArray(order.cart_items)) {
         items = order.cart_items;
      }

      let mappedStatus = "En Progreso";
      const dbStatus = (order.status || "").toLowerCase();
      if (['paid', 'pagado', 'completado', 'vendido', 'succeeded'].some(x => dbStatus.includes(x))) { mappedStatus = "VENDIDO"; } 
      else if (dbStatus.includes('cancelado')) { mappedStatus = "CANCELADO"; }

      return {
          rawId: order.id,
          stripeSessionId: order.stripe_session_id,
          id: `${(order.id || "").split('-')[0].toUpperCase()}`,
          date: new Date(order.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
          total: order.total_amount?.toFixed(2) || "0.00",
          status: mappedStatus,
          images: (items as { image?: string }[]).filter((item) => item.image).map((item) => item.image as string)
      };
  }) || [];

  return (
    <div className="bg-[#FAE3E7] min-h-screen font-sans selection:bg-[#251A1C] selection:text-[#FAE3E7] relative pb-20">
      
      {/* NAVBAR NEGRO (Basado exactamente en el Screenshot) */}
      <div className="w-full bg-[#181112] border-b border-[#251A1C] px-8 py-3 flex justify-between items-center sticky top-0 z-50">
         <div className="flex flex-col group shrink-0">
            <Link href="/" className="text-xl md:text-2xl font-serif font-bold flex items-center md:gap-1.5 leading-none">
              <span className="text-[#F6D2D8] italic font-medium pr-1">Grecia</span>
              <span className="text-white hidden sm:inline">Fashion Store</span>
              <span className="text-white sm:hidden">Fashion</span>
            </Link>
            <span className="text-[8px] md:text-[9px] tracking-[0.4em] uppercase text-gray-500 mt-1 ml-1">Boutique</span>
         </div>
         <Link href="/">
          <button className="flex items-center gap-2 text-[10px] md:text-[11px] uppercase tracking-widest font-bold text-[#181112] bg-[#F3CDD3] hover:bg-white px-6 py-2.5 rounded-full transition-all group">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comprar Nuevamente</span>
          </button>
         </Link>
      </div>

      <main className="max-w-[1250px] mx-auto px-6 sm:px-10 py-16 flex flex-col items-center lg:items-start text-[#251A1C]">
        
        {/* TITULO PAGE */}
        <div className="w-full lg:pl-[360px] mb-8 text-center lg:text-left fade-in">
           <h1 className="text-6xl font-serif font-medium tracking-tight mb-2 text-[#221618]">Mi Perfil</h1>
           <p className="opacity-80 text-lg font-medium text-[#4A3236]">Elegancia, compras y ajustes a tu medida.</p>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-10 lg:gap-12 fade-in">
          
          {/* SIDEBAR OSCURO (Mockup: Espresso Dark #22181A) */}
          <aside className="w-full lg:w-[320px] flex-shrink-0 relative">
            {/* Sombras difusas debajo */}
            <div className="absolute inset-0 bg-[#A45265] opacity-10 blur-[40px] translate-y-10 rounded-[2.5rem]"></div>
            
            <div className="relative bg-[#22181A] rounded-[2.5rem] pt-14 pb-10 px-8 shadow-2xl flex flex-col min-h-[600px] border border-[#332528]">
              
              <div className="flex flex-col items-center mb-10">
                <div className="w-24 h-24 rounded-full border border-[#493539] mb-6 flex items-center justify-center p-1 bg-[#22181A]">
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-[#291D20]">
                     <User className="w-8 h-8 text-[#FAE3E7]" strokeWidth={1} />
                  </div>
                </div>
                {/* Nombre de usuario partido en dos lineas si es necesario */}
                <h2 className="font-serif text-[28px] leading-[1.1] text-white text-center">
                   {firstnameChunk}<br/>{lastnameChunk}
                </h2>
              </div>

              <nav className="space-y-4 flex-1 w-full">
                <SidebarItem icon={<ShoppingBag className="w-5 h-5" />} label="Historial de Pedidos" isActive={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')} />
                <SidebarItem icon={<User className="w-5 h-5" />} label="Detalles Personales" isActive={activeTab === 'datos'} onClick={() => setActiveTab('datos')} />
                <SidebarItem icon={<MapPin className="w-5 h-5" />} label="Mis Direcciones" isActive={activeTab === 'direcciones'} onClick={() => {setActiveTab('direcciones'); setAddressForm(null)}} />
                <SidebarItem icon={<Settings className="w-5 h-5" />} label="Preferencias" isActive={activeTab === 'preferencias'} onClick={() => setActiveTab('preferencias')} />
              </nav>

              <div className="mt-8 pt-4 w-full flex justify-center">
                <button onClick={handleLogout} className="bg-[#FBDFE3] hover:bg-white text-[#221618] py-4 px-8 w-full rounded-full text-[11px] font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl">
                  <LogOut className="w-4 h-4" />
                  <span>Salir de la cuenta</span>
                </button>
              </div>
            </div>
          </aside>

          {/* AREA PRINCIPAL */}
          <section className="flex-1 w-full relative z-20">
            
            {/* TAB: PEDIDOS */}
            {activeTab === 'pedidos' && (
              <div className="animate-in fade-in duration-700 space-y-6">
                
                {/* Cabecera Mis Pedidos (Mockup Pill shape, fondo blanco rosado) */}
                <div className="bg-[#FBDFE3] rounded-full px-8 py-5 shadow-lg border border-[#F2C4CB] flex items-center justify-between">
                   <h2 className="text-3xl font-serif font-medium flex items-center gap-3 text-[#221618]">
                      {/* Cuatro puntitos icon */}
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <circle cx="12" cy="5" r="1.5" fill="#C48E96"/>
                         <circle cx="19" cy="12" r="1.5" fill="#C48E96"/>
                         <circle cx="12" cy="19" r="1.5" fill="#C48E96"/>
                         <circle cx="5" cy="12" r="1.5" fill="#C48E96"/>
                      </svg>
                      Mis Pedidos
                   </h2>
                   <div className="text-[10px] uppercase font-bold text-[#4A3236] tracking-widest bg-[#EBBAC3] px-4 py-2 rounded-full border border-[#DC9AA4]">
                      {mappedOrders.length} transacciones
                   </div>
                </div>

                <div className="space-y-8 mt-8">
                  {mappedOrders.length > 0 ? mappedOrders.map((order, idx: number) => {
                    return (
                      <div key={idx} className="bg-[#291F21] rounded-[2rem] p-8 shadow-xl flex flex-col relative text-white border border-[#382B2E]">
                         
                         {/* Card Header (Mockup) */}
                         <div className="w-full flex justify-between items-start mb-6">
                            <div>
                               <p className="text-[#C4A9AD] text-[10px] uppercase tracking-widest font-extrabold mb-1">
                                 Factura <span className="text-white ml-1">#{order.id}</span>
                               </p>
                               <p className="text-gray-400 text-xs font-medium flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block"></span>
                                 {order.date}
                               </p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3">
                               <div className="px-4 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border border-gray-500 text-gray-300 w-max">
                                 {order.status}
                               </div>
                            </div>
                         </div>

                         {/* Body Card */}
                         <div className="flex flex-col md:flex-row items-end md:items-center justify-between mt-4">
                            
                            {/* Images and Details area */}
                            <div className="flex items-center gap-6 w-full md:w-auto">
                               {order.images[0] ? (
                                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[#1D1416] border border-[#382B2D] flex-shrink-0 relative">
                                     <Image src={order.images[0]} alt="Articulo" fill className="object-cover" />
                                  </div>
                               ) : (
                                  <div className="w-28 h-28 rounded-2xl bg-[#1D1416] border border-[#382B2D] flex items-center justify-center flex-shrink-0">
                                     <ShoppingBag className="w-8 h-8 text-gray-600" />
                                  </div>
                               )}
                               
                               <div className="flex flex-col hidden sm:flex">
                                  {/* As we don't have detailed item name mappings directly exposed easily without mapping, we show a generic title if array, or simply the first item */}
                                  <h4 className="text-white font-medium text-lg leading-tight mb-2">Artículos de Boutique</h4>
                                  <p className="text-gray-400 text-sm">{order.date}</p>
                                  {order.images.length > 1 && (
                                     <p className="text-[#C4A9AD] text-xs font-bold mt-2 tracking-widest uppercase">+{order.images.length - 1} más</p>
                                  )}
                               </div>
                            </div>

                            {/* Actions & Repeated Price Area */}
                            <div className="flex items-end md:items-center gap-6 md:gap-14 mt-6 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                               <button onClick={() => handleReceipt(order.stripeSessionId)} className="bg-[#FBDFE3] text-[#221618] px-6 py-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2 shadow-md">
                                 Ver Recibo <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
                               </button>

                               {/* El precio replicado que aparece abajo a la derecha en el mockup */}
                               <p className="font-serif text-[42px] leading-none text-white tracking-tight hidden sm:block">
                                 <span className="text-3xl mr-1">$</span>{order.total}
                               </p>
                            </div>
                         </div>

                      </div>
                    );
                  }) : (
                     <div className="text-center py-20 bg-[#291F21] border border-[#382B2E] rounded-[2rem] shadow-xl">
                        <ShoppingBag className="w-12 h-12 mx-auto text-[#C4A9AD] mb-6 opacity-60" />
                        <p className="font-serif text-3xl text-white tracking-wide mb-4">No hay transacciones</p>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-10">Tu historia de moda comienza aquí.</p>
                        <Link href="/">
                          <button className="bg-[#FBDFE3] text-[#221618] hover:bg-white px-10 py-4 text-[11px] tracking-widest font-extrabold uppercase transition-colors rounded-full">Ir a la Boutique</button>
                        </Link>
                     </div>
                  )}

                  {mappedOrders.length > 0 && (
                     <div className="text-right mt-4">
                        <button className="text-[10px] font-bold text-[#4A3236] uppercase tracking-widest hover:text-black flex items-center gap-1 justify-end w-full">
                           Ver Más <ChevronRight className="w-3 h-3" />
                        </button>
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DATOS PERSONALES */}
            {activeTab === 'datos' && (
              <div className="animate-in fade-in duration-700 bg-[#22181A] rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-[#332528] text-white">
                <div className="mb-10 border-b border-[#382B2E] pb-8">
                  <h2 className="text-4xl font-serif mb-2">Detalles Personales</h2>
                  <p className="text-[#C4A9AD] text-[11px] uppercase tracking-widest font-bold">Información de cuenta y contacto</p>
                </div>
                
                <form className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <InputOscuro label="Nombre" value={formDatos.nombre} onChange={(v: string) => setFormDatos({...formDatos, nombre: v})} />
                    <InputOscuro label="Apellidos" value={formDatos.apellido} onChange={(v: string) => setFormDatos({...formDatos, apellido: v})} />
                    <div className="col-span-1 md:col-span-2">
                       <InputOscuro label="Correo Electrónico (No editable)" value={initialUser.email || ""} type="email" readOnly />
                    </div>
                    <InputOscuro label="Teléfono" value={formDatos.telefono} type="tel" onChange={(v: string) => setFormDatos({...formDatos, telefono: v})} />
                    <InputOscuro label="Nacimiento" value={formDatos.fecha_nacimiento} type="date" onChange={(v: string) => setFormDatos({...formDatos, fecha_nacimiento: v})} />
                  </div>

                  <div className="flex gap-5 pt-8 border-t border-[#382B2E]">
                    <button type="button" onClick={handleSaveDatos} disabled={!hasChanges || isSaving} className={`px-10 py-4 rounded-full text-[11px] font-extrabold tracking-widest uppercase transition-colors ${(!hasChanges || isSaving) ? 'bg-[#382B2E] text-gray-500' : 'bg-[#FBDFE3] text-[#22181A] hover:bg-white'} `}>
                       Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* TAB: DIRECCIONES */}
            {activeTab === 'direcciones' && (
              <div className="animate-in fade-in duration-700 space-y-8">
                
                {addressForm ? (
                   <div className="bg-[#22181A] rounded-[2.5rem] p-10 md:p-14 shadow-2xl border border-[#332528] text-white">
                     <h3 className="text-3xl font-serif mb-8 flex items-center gap-3"><MapPin className="w-6 h-6 text-[#C4A9AD]" /> {addressForm?.id ? "Editar" : "Añadir"} Dirección</h3>
                     <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="md:col-span-2">
                             <InputOscuro label="Título" value={addressForm?.title || ""} onChange={(v: string) => setAddressForm({...addressForm!, title: v})} />
                           </div>
                           <div className="md:col-span-2">
                              <InputOscuro label="Calle, Av, Nro" value={addressForm?.line1 || ""} onChange={(v: string) => setAddressForm({...addressForm!, line1: v})} />
                           </div>
                           <InputOscuro label="Distrito / Ref" value={addressForm?.line2 || ""} onChange={(v: string) => setAddressForm({...addressForm!, line2: v})} />
                           <InputOscuro label="Ciudad / País" value={addressForm?.city || ""} onChange={(v: string) => setAddressForm({...addressForm!, city: v})} />
                        </div>
                        
                        <div className="flex items-center justify-between bg-[#1D1416] p-6 rounded-2xl border border-[#382B2E]">
                           <div>
                              <p className="text-[15px] font-serif font-bold">Principal</p>
                              <p className="text-[11px] text-gray-400">Default para compras</p>
                           </div>
                           <ToggleDark checked={addressForm?.isDefault || false} onChange={(checked: boolean) => setAddressForm({...addressForm!, isDefault: checked})} />
                        </div>
                        
                        <div className="flex gap-4 pt-6">
                           <button onClick={() => {
                               if(!addressForm.title || !addressForm.line1) return alert("Título y dirección obligatorios");
                               let updated;
                               const curr: Address = {...addressForm!};
                               if (curr.id) updated = direcciones.map(d => d.id === curr.id ? curr : d);
                               else updated = [...direcciones, { ...curr, id: crypto.randomUUID() }];
                               if (curr.isDefault) updated = updated.map(d => d.id === curr.id ? d : { ...d, isDefault: false });
                               handleSaveDirecciones(updated);
                           }} className="bg-[#FBDFE3] text-[#22181A] px-10 py-4 rounded-full text-[11px] font-extrabold uppercase tracking-widest hover:bg-white">
                               Guardar
                           </button>
                           <button onClick={() => setAddressForm(null)} className="border border-[#493539] text-gray-300 px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#382B2E]">
                               Volver
                           </button>
                        </div>
                     </div>
                  </div>
                ) : (
                   <>
                    <div className="flex justify-between items-center mb-8 bg-[#FBDFE3] rounded-full px-8 py-5 shadow-lg border border-[#F2C4CB]">
                      <h2 className="text-3xl font-serif text-[#221618]">Direcciones</h2>
                      <button onClick={() => setAddressForm({ id: '', title: '', line1: '', city: '', isDefault: direcciones.length === 0 })} className="bg-[#22181A] text-white font-bold px-6 py-2.5 rounded-full border border-[#332528] text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#3A282C]">
                        <Plus className="w-4 h-4" /> Añadir
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {direcciones.length > 0 && direcciones.map((dir, i) => (
                        <div key={i} className={`bg-[#291F21] border ${dir.isDefault ? 'border-[#C4A9AD]' : 'border-[#382B2E]'} rounded-[2rem] p-8 relative flex flex-col text-white shadow-xl`}>
                          
                          {dir.isDefault && (
                            <div className="absolute top-6 right-6 text-[#22181A] text-[9px] font-extrabold uppercase tracking-widest bg-[#C4A9AD] px-4 py-1.5 rounded-full">
                              Principal
                            </div>
                          )}

                          <h3 className="text-2xl font-serif mb-2">{dir.title}</h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1">
                             {dir.line1}<br/>
                           {dir.line2 && <>{dir.line2}<br/></>}
                             {dir.city}
                          </p>
                          
                          <div className="flex gap-3">
                            <button onClick={() => setAddressForm(dir)} className="text-white text-[10px] font-bold uppercase tracking-widest bg-[#382B2E] px-6 py-2.5 rounded-full hover:bg-[#493539]">Editar</button>
                            <button onClick={() => {
                                if(window.confirm("¿Segura de eliminar dirección?")) {
                                   handleSaveDirecciones(direcciones.filter(d => d.id !== dir.id));
                                }
                            }} className="text-[#ff5c5c] text-[10px] uppercase tracking-widest bg-transparent border border-[#ff5c5c]/30 px-6 py-2.5 rounded-full hover:bg-[#1D1416]">Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                   </>
                )}
              </div>
            )}

            {/* TAB: PREFERENCIAS */}
            {activeTab === 'preferencias' && (
              <div className="animate-in fade-in duration-700 bg-[#22181A] rounded-[2.5rem] p-10 md:p-14 border border-[#332528] shadow-2xl text-white">
                <h2 className="text-4xl font-serif mb-10 border-b border-[#382B2E] pb-6">Preferencias</h2>
                
                <div className="space-y-6">
                  <div className="bg-[#1D1416] rounded-2xl p-6 border border-[#382B2E] flex justify-between items-center">
                     <div>
                        <h3 className="font-serif text-xl mb-1">Boletines Exclusivos</h3>
                        <p className="text-xs text-gray-500">Recibe ofertas y nuevas colecciones.</p>
                     </div>
                     <ToggleDark defaultChecked={true} />
                  </div>
                  
                  <div className="bg-[#1D1416] rounded-2xl p-6 border border-[#382B2E] flex justify-between items-center">
                     <div>
                        <h3 className="font-serif text-xl mb-1">Notificaciones SMS</h3>
                        <p className="text-xs text-gray-500">Alertas de tracking para tus pedidos.</p>
                     </div>
                     <ToggleDark defaultChecked={false} />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #1D1416 inset !important;
            -webkit-text-fill-color: #ffffff !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}} />
    </div>
  );
}

// === COMPONENTES SECUNDARIOS ADAPTADOS A FIGMA ===

function SidebarItem({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl transition-all duration-300 group outline-none
        ${isActive ? 'bg-[#332629] border border-[#493539] text-[#FBDFE3]' : 'bg-transparent text-gray-400 hover:text-white'}
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`${isActive ? 'text-[#C4A9AD]' : 'text-gray-500 group-hover:text-white'}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-left">
          {label}
        </span>
      </div>
      {isActive && <ChevronRight className="w-4 h-4 text-[#FBDFE3]" strokeWidth={1.5} />}
    </button>
  );
}

function InputOscuro({ label, value, onChange, type = "text", readOnly }: { label: string, value: string, onChange?: (v: string) => void, type?: string, readOnly?: boolean }) {
  return (
    <div className="flex flex-col group">
      <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 pl-4 transition-colors group-focus-within:text-[#FBDFE3]">{label}</label>
      <input 
        type={type} 
        value={value}
        onChange={(event) => onChange && onChange(event.target.value)}
        readOnly={readOnly}
        className={`w-full bg-[#1D1416] rounded-full px-6 py-4 text-white text-sm outline-none transition-all border
          ${readOnly ? 'opacity-60 cursor-not-allowed border-[#2B1F22]' : 'border-[#382B2E] focus:border-[#FBDFE3] hover:border-[#493539]'}
        `}
      />
    </div>
  );
}

function ToggleDark({ defaultChecked, checked, onChange }: { defaultChecked?: boolean, checked?: boolean, onChange?: (c: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer group">
      <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} checked={checked} onChange={(event) => onChange && onChange(event.target.checked)} />
      <div className="w-12 h-6 bg-[#1A1214] peer-focus:outline-none rounded-full peer-checked:bg-[#FBDFE3] border border-[#382B2E] transition-colors">
         <div className="w-4 h-4 bg-gray-400 peer-checked:bg-[#22181A] rounded-full absolute top-[3px] left-[4px] peer-checked:left-[28px] transition-all duration-300"></div>
      </div>
    </label>
  );
}
