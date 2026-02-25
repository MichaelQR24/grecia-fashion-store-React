import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

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

        // 2. Conectar a Supabase (Validando con el usuario actualmente logueado para RLS)
        const supabase = await createClient();

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

        return NextResponse.json({ success: true, order: newOrder });

    } catch (err: any) {
        console.error('Order verification error:', err);
        return NextResponse.json({ error: err.message || 'Error verificando la orden internamente' }, { status: 500 });
    }
}
