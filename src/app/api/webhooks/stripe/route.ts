import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@supabase/supabase-js';
import type { WebhookCartItem, DiscountMetadata } from '@/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    // 1. VERIFICAR LA FIRMA CRIPTOGRÁFICA DE STRIPE
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        // ✅ R3: Reportar intento de firma inválida a Sentry (posible ataque)
        Sentry.captureException(err, {
            tags: { endpoint: 'stripe_webhook', type: 'signature_failure' },
            extra: { signatureHeader: signature?.substring(0, 20) + '...' },
        });
        console.error(`⚠️ Webhook signature verification failed: ${message}`);
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    // 2. FILTRAR SÓLO EL EVENTO DE CHECKOUT COMPLETADO
    console.log(`📩 Webhook recibido: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log(`🔍 Procesando sesión: ${session.id}`);
        console.log(`🔍 client_reference_id: ${session.client_reference_id}`);
        console.log(`🔍 metadata:`, session.metadata);

        // Expandir los line_items para obtener qué productos se vendieron
        const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price.product', 'discounts.promotion_code']
        });

        const sessionId = session.id;
        // ✅ Fallback: si client_reference_id está vacío, intentar desde metadata
        const userId = session.client_reference_id || session.metadata?.user_id || null;
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || 'Cliente';
        const customerPhone = session.customer_details?.phone || null;

        console.log(`✅ Procesando Webhook para UserId: ${userId}`);
        console.log(`📦 Stripe Session ID: ${session.id}`);

        if (!userId || userId === 'anonymous') {
            console.error('⚠️ La sesión no tiene un usuario válido asociado. client_reference_id:', session.client_reference_id, 'metadata.user_id:', session.metadata?.user_id);
            return NextResponse.json({ error: 'La sesión no tiene un usuario asociado' }, { status: 400 });
        }

        // 3. CONECTAR A SUPABASE EN MODO ADMIN (SERVICE ROLE) PARA SALTAR RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

        if (!supabaseServiceKey) {
            console.error('CRÍTICO: SUPABASE_SERVICE_ROLE_KEY no está definida. Transacción abortada.');
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 4. PREVENIR DUPLICACIÓN DE ÓRDENES (IDEMPOTENCIA)
        const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_session_id', sessionId)
            .single();

        if (existingOrder) {
            console.log(`Orden ${existingOrder.id} ya existe para esta sesión. Ignorando evento.`);
            return NextResponse.json({ received: true }); // Acknowledge to Stripe
        }

        // 5. RECONSTRUIR EL CARRITO DESDE STRIPE DIRECTAMENTE
        const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
        
        console.log(`💰 Total: $${totalAmount}`);
        console.log(`📦 Line items count: ${sessionWithLineItems.line_items?.data.length || 0}`);

        const cartItems: (WebhookCartItem | DiscountMetadata)[] = sessionWithLineItems.line_items?.data.map((item) => {
            const product = item.price?.product as Stripe.Product;
            const cartItem = {
                id: product.metadata.product_id || product.id,
                name: product.name,
                image: product.metadata.image || '',
                price: item.price ? item.price.unit_amount! / 100 : 0,
                quantity: item.quantity || 1
            };
            console.log(`  📦 Item: ${cartItem.name} x${cartItem.quantity} @ $${cartItem.price}`);
            return cartItem;
        }) || [];

        // Inyectar descuento si aplica
        if (sessionWithLineItems.total_details && sessionWithLineItems.total_details.amount_discount > 0) {
            const discountAmount = sessionWithLineItems.total_details.amount_discount / 100;
            let couponCode = 'DESCUENTO APLICADO';

            if (sessionWithLineItems.discounts && sessionWithLineItems.discounts.length > 0) {
                const promo = sessionWithLineItems.discounts[0].promotion_code as Stripe.PromotionCode;
                if (promo && promo.code) couponCode = promo.code;
            }

            cartItems.push({
                //@ts-ignore -> Metadato especial de descuento
                isMetadata: true, type: 'discount_info', code: couponCode, amount: discountAmount
            });
        }

        // 6. INSERTAR LA ORDEN SEGURA SALTANDO EL RLS
        const orderPayload = {
            user_id: userId,
            stripe_session_id: sessionId,
            total_amount: totalAmount,
            cart_items: cartItems,
            status: 'paid',
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone
        };

        console.log('📝 Procediendo a insertar orden en base de datos...');

        const { data: newOrder, error } = await supabaseAdmin
            .from('orders')
            .insert(orderPayload)
            .select()
            .single();

        if (error) {
            console.error('❌ Error crítico guardando orden en Supabase:', JSON.stringify(error, null, 2));
            console.error('❌ Detalle: code=' + error.code + ' message=' + error.message + ' details=' + error.details + ' hint=' + error.hint);
            return NextResponse.json({ error: 'Error interno DB' }, { status: 500 });
        }

        console.log(`✅ Orden ${newOrder.id} registrada con éxito vía Webhook.`);

        // 7. DESCONTAR EL INVENTARIO ATÓMICAMENTE VÍA RPC
        try {
            const productItems = cartItems.filter((i): i is WebhookCartItem => !i.isMetadata);
            await Promise.all(productItems.map(async (item) => {
                const { error: rpcError } = await supabaseAdmin.rpc('decrement_stock', {
                    product_id: item.id,
                    deduct_amount: item.quantity
                });

                if (rpcError) {
                    // ✅ BONUS: Log estructurado con suficiente detalle para corrección manual
                    const errorDetail = {
                        product_id: item.id,
                        product_name: item.name,
                        quantity_to_deduct: item.quantity,
                        order_id: newOrder.id,
                        stripe_session: sessionId,
                        rpc_error_code: rpcError.code,
                        rpc_error_message: rpcError.message,
                        rpc_error_details: rpcError.details,
                        rpc_error_hint: rpcError.hint,
                        timestamp: new Date().toISOString(),
                        action_required: 'MANUAL_STOCK_ADJUSTMENT',
                    };
                    console.error('❌ CRÍTICO — decrement_stock falló. Se requiere ajuste manual:', JSON.stringify(errorDetail, null, 2));
                    // ✅ R3: Alerta crítica a Sentry con contexto completo
                    Sentry.captureMessage(`Stock no descontado: ${item.name} (x${item.quantity})`, {
                        level: 'error',
                        tags: { endpoint: 'stripe_webhook', type: 'stock_decrement_failure' },
                        extra: errorDetail,
                    });
                }
            }));
        } catch (stockError) {
            Sentry.captureException(stockError, {
                tags: { endpoint: 'stripe_webhook', type: 'stock_decrement_exception' },
                extra: { orderId: newOrder.id, sessionId },
            });
            console.error('La orden se salvó pero hubo error descontando stock:', stockError);
        }

        // 8. Opcional: Aquí iría el envío de Email (Resend) copiando la lógica original pero segura

        return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
}
