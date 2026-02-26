import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
    try {
        const { sessionId, cartItems } = await req.json();

        if (!sessionId || !cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: 'Faltan parámetros de sesión o carrito.' }, { status: 400 });
        }

        // 1. Obtener la sesión real de Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Si el pago no está completo, rechazar.
        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'El pago no ha sido completado en Stripe' }, { status: 400 });
        }

        const userId = session.client_reference_id;
        if (!userId) {
            return NextResponse.json({ error: 'La sesión no tiene un usuario asociado' }, { status: 400 });
        }

        // 2. Conectar a Supabase como Administrador Server-Side (Service Role)
        // Ya que los Webhooks de Stripe suceden "en el fondo", Next.js no tiene las Cookies del navegador del usuario.
        // Usamos `@supabase/supabase-js` directo importado arriba en lugar del ayudante de SSR para forzar el registro y salto de RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        // Para entornos Server-Side seguros idealmente usamos SUPABASE_SERVICE_ROLE_KEY.
        // Al no tenerla configurada, usamos la ANON_KEY localmente (Requiere que modifiquemos RLS temporalmente)
        const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Verificamos si la orden ya fue registrada anteriormente (Prevenir F5 Duplicados)
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('stripe_session_id', sessionId)
            .single();

        if (existingOrder) {
            return NextResponse.json({ success: true, message: 'Orden ya existente', orderId: existingOrder.id });
        }

        // 4. Insertar la nueva orden
        const totalAmount = session.amount_total ? session.amount_total / 100 : 0; // Convertir de centavos a Dólares

        const { data: newOrder, error } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                stripe_session_id: sessionId,
                total_amount: totalAmount,
                cart_items: cartItems,
                status: 'paid'
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        // 5. Reducir el Stock en la Base de Datos ('products')
        try {
            // Se usa el Service Role en el backend para poder sobreescribir stocks si es necesario sin chocar con RLS
            // Pero por simplicidad de nuestro entorno actual usaremos el array de elementos del carrito:
            await Promise.all(cartItems.map(async (item: { id: string; quantity: number }) => {
                // Selecciona el stock actual del producto
                const { data: productData, error: fetchError } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', item.id)
                    .single();

                if (!fetchError && productData) {
                    const newStock = Math.max(0, productData.stock - item.quantity);

                    // Actualiza con el nuevo stock reducido
                    await supabase
                        .from('products')
                        .update({ stock: newStock })
                        .eq('id', item.id);
                }
            }));
        } catch (stockError) {
            console.error("Error al descontar stock (la orden sí se guardó):", stockError);
            // No detenemos el flujo, la orden ya fue pagada y registrada en el paso 4.
        }

        return NextResponse.json({ success: true, order: newOrder });

    } catch (err: unknown) {
        console.error('Order verification error:', err);
        return NextResponse.json({ error: (err as Error).message || 'Error verificando la orden internamente' }, { status: 500 });
    }
}
