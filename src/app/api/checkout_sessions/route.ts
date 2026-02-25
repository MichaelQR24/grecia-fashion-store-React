import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
    try {
        const { items, customerEmail, userId, destinationUrl } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
        }

        // Transformar items del carrito de Grecia Fashion al formato que espera Stripe (LineItems)
        const lineItems = items.map((item: any) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.name,
                    images: [item.image],
                    description: `Talla Única - Ref: ${item.category}`,
                },
                unit_amount: Math.round(item.price * 100), // Stripe espera centavos ($10.50 = 1050)
            },
            quantity: item.quantity,
        }));

        // Crear Sesión de Pago Segura en Servidores de Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: customerEmail || undefined,
            client_reference_id: userId || undefined,
            success_url: `${destinationUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${destinationUrl}/checkout/canceled`,
            submit_type: 'pay',
            billing_address_collection: 'required',
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'MX', 'CO'], // Configurado para América por defecto
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });

    } catch (err: any) {
        console.error('Stripe Integration Error:', err);
        return NextResponse.json({ error: err.message || 'Error procesando checkout' }, { status: 500 });
    }
}
