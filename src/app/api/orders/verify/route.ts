import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import ReceiptEmail from '@/components/emails/ReceiptEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
    try {
        const { sessionId, cartItems } = await req.json();

        if (!sessionId || !cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: 'Faltan parámetros de sesión o carrito.' }, { status: 400 });
        }

        // 1. Obtener la sesión real de Stripe con los line_items y el código promocional
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items', 'discounts.promotion_code']
        });

        // Si el pago no está completo, rechazar.
        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'El pago no ha sido completado en Stripe' }, { status: 400 });
        }

        const userId = session.client_reference_id;
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || 'Cliente';
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

        // 4. Procesar carrito de compra e inyectar Metadatos del Cupón si los hay
        const totalAmount = session.amount_total ? session.amount_total / 100 : 0; // Convertir de centavos a Dólares
        let finalCartItems = [...cartItems];

        if (session.total_details && session.total_details.amount_discount > 0) {
            const discountAmount = session.total_details.amount_discount / 100;
            let couponCode = 'DESCUENTO APLICADO';

            if (session.discounts && session.discounts.length > 0) {
                const promo = session.discounts[0].promotion_code as Stripe.PromotionCode;
                if (promo && promo.code) {
                    couponCode = promo.code;
                }
            }

            finalCartItems.push({
                isMetadata: true,
                type: 'discount_info',
                code: couponCode,
                amount: discountAmount,
                originalSubtotal: (session.amount_subtotal || 0) / 100
            });
        }

        const customerPhone = session.customer_details?.phone || null;

        const { data: newOrder, error } = await supabase
            .from('orders')
            .insert({
                user_id: userId,
                stripe_session_id: sessionId,
                total_amount: totalAmount,
                cart_items: finalCartItems,
                status: 'paid',
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        // 5. Reducir el Stock en la Base de Datos ('products') de FORMA SEGURA (Evitando Race Conditions)
        try {
            await Promise.all(cartItems.map(async (item: { id: string; quantity: number }) => {
                // LLAMADA RPC (Remote Procedure Call) a Postgres. Restará atómicamente en la capa de base de datos.
                // REQUIERE crear esta función en el panel SQL de Supabase:
                /* 
                   create or replace function decrement_stock(product_id uuid, deduct_amount int)
                   returns void as $$
                   begin
                     update products set stock = greatest(0, stock - deduct_amount) where id = product_id;
                   end;
                   $$ language plpgsql;
                */
                const { error: rpcError } = await supabase.rpc('decrement_stock', {
                    product_id: item.id,
                    deduct_amount: item.quantity
                });

                if (rpcError) {
                    console.error("Error en RPC decrement_stock:", rpcError);
                    // Fallback (NO RECOMENDADO PARA PRODUCCIÓN POR RACE CONDITIONS):
                    const { data: productData, error: fetchError } = await supabase.from('products').select('stock').eq('id', item.id).single();
                    if (!fetchError && productData) {
                        const newStock = Math.max(0, productData.stock - item.quantity);
                        await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
                    }
                }
            }));
        } catch (stockError) {
            console.error("Error al descontar stock (la orden sí se guardó):", stockError);
            // No detenemos el flujo, la orden ya fue pagada y registrada en el paso 4.
        }

        // 6. Enviar Recibo por Correo con Resend
        if (customerEmail && process.env.RESEND_API_KEY) {
            try {
                // Formatear items desde Stripe line_items
                const emailItems = session.line_items?.data.map(lineItem => ({
                    name: lineItem.description || 'Producto',
                    quantity: lineItem.quantity || 1,
                    price: (lineItem.amount_total / 100) / (lineItem.quantity || 1)
                })) || [];

                await resend.emails.send({
                    from: 'Grecia Fashion Store <onboarding@resend.dev>', // Usar onboarding@resend.dev para pruebas gratuitas
                    to: [customerEmail],
                    subject: `Confirmación de Pedido - ${newOrder?.id?.split('-')[0] || 'GRC'}`,
                    react: ReceiptEmail({
                        customerName: customerName,
                        orderId: newOrder?.id || sessionId,
                        items: emailItems,
                        total: totalAmount
                    })
                });
                console.log("Email de recibo enviado a:", customerEmail);
            } catch (emailError) {
                console.error("No se pudo enviar el recibo (Stripe/Resend)", emailError);
            }
        }

        return NextResponse.json({ success: true, order: newOrder });

    } catch (err: unknown) {
        console.error('Order verification error:', err);
        return NextResponse.json({ error: (err as Error).message || 'Error verificando la orden internamente' }, { status: 500 });
    }
}
