import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/utils/supabase/server';
import { rateLimit } from '@/lib/rateLimit';
import type { CartItemRequest } from '@/types';

export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
    // ✅ R1: Rate Limiting — máximo 10 solicitudes por minuto por IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
    const limiter = rateLimit(`checkout:${ip}`, 10, 60_000);
    if (!limiter.allowed) {
        return NextResponse.json(
            { error: `Demasiadas solicitudes. Espera ${Math.ceil(limiter.retryAfterMs / 1000)}s antes de reintentar.` },
            { status: 429, headers: { 'Retry-After': String(Math.ceil(limiter.retryAfterMs / 1000)) } }
        );
    }

    try {
        const { items, customerEmail, userId } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
        }

        // 1. VALIDAR Y EXTRAER IDS DEL CARRITO
        if (!Array.isArray(items) || items.some((i: CartItemRequest) => !i.id || typeof i.quantity !== 'number' || i.quantity < 1)) {
            return NextResponse.json({ error: 'Formato de carrito inválido.' }, { status: 400 });
        }
        const productIds: string[] = items.map((item: CartItemRequest) => item.id);

        // 2. CONSULTAR PRECIOS Y STOCK SEGUROS DESDE SUPABASE
        const supabase = await createClient();
        const { data: realProducts, error } = await supabase
            .from('products')
            .select('id, name, price, image, category, stock')
            .in('id', productIds);

        if (error || !realProducts) {
            return NextResponse.json({ error: 'Error verificando catálogo de seguridad.' }, { status: 500 });
        }

        // 3. CONSTRUIR ITEMS CON PRECIO DEL SERVIDOR + VALIDAR STOCK
        const lineItems = items.map((cartItem: CartItemRequest) => {
            const realProduct = realProducts.find(p => p.id === cartItem.id);
            if (!realProduct) throw new Error(`Producto inválido o agotado: ${cartItem.id}`);

            // ✅ Verificar stock antes de crear la sesión de pago
            if (realProduct.stock < cartItem.quantity) {
                throw new Error(`Sin stock suficiente para: ${realProduct.name} (disponible: ${realProduct.stock}, solicitado: ${cartItem.quantity})`);
            }

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: realProduct.name,
                        images: [realProduct.image],
                        description: `Categoría: ${realProduct.category}`,
                        metadata: {
                            product_id: realProduct.id,
                            image: realProduct.image,
                        }
                    },
                    unit_amount: Math.round(realProduct.price * 100), // PRECIO 100% SEGURO
                },
                quantity: cartItem.quantity,
            };
        });

        // ✅ Usar origin del servidor, NUNCA datos del frontend
        const origin = new URL(req.url).origin;

        // Crear Sesión de Pago Segura en Servidores de Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: customerEmail || undefined,
            client_reference_id: userId || undefined,
            // ✅ Metadata de auditoría: permite al webhook validar procedencia
            metadata: {
                user_id: userId || 'anonymous',
                product_ids: productIds.join(','),
                created_from: 'grecia-checkout-api',
            },
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/canceled`,
            submit_type: 'pay',
            billing_address_collection: 'required',
            allow_promotion_codes: true,
            phone_number_collection: { enabled: true },
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'MX', 'CO', 'PE'],
            }
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });

    } catch (err: unknown) {
        // ✅ R3: Reporte a Sentry en producción + log local
        Sentry.captureException(err, {
            tags: { endpoint: 'checkout_sessions', layer: 'payment' },
            extra: { ip },
        });
        console.error('Stripe Integration Error:', err);
        return NextResponse.json({ error: (err as Error).message || 'Error procesando checkout' }, { status: 500 });
    }
}
