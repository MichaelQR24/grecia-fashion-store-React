import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/utils/supabase/server';
import { upstashRateLimit } from '@/lib/upstashRateLimit';
import type { CartItemRequest } from '@/types';

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com'; // Usar 'https://api-m.paypal.com' para Producción

// Función Auxiliar: Obtener Token Criptográfico Temporal de la API de PayPal
async function getPayPalAccessToken() {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Faltan credenciales de PayPal en .env");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
        throw new Error('No se pudo autenticar con PayPal');
    }

    const data = await res.json();
    return data.access_token;
}

// Endpoint Principal: Servidor crea la orden para entregarla segura al navegador
export async function POST(req: Request) {
    // ✅ R1: Rate Limiting — máximo 10 solicitudes de PayPal por minuto por IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';

    // ✅ R1: Upstash Distributed Rate Limiting (Anti Card-Testing)
    const { success, reset } = await upstashRateLimit.limit(`paypal:${ip}`);
    
    if (!success) {
        const now = Date.now();
        const retryAfter = Math.ceil((reset - now) / 1000);
        return NextResponse.json(
            { error: `Demasiados intentos. Por favor, espera un momento antes de volver a intentar el pago.` },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    try {
        const { items } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
        }

        // 1. EXTRAER IDS DEL CARRITO
        const productIds = items.map((item: CartItemRequest) => item.id);

        // 2. CONSULTAR PRECIOS Y STOCK REALES DESDE SUPABASE (Nunca confiar en el Front-End)
        const supabase = await createClient();
        const { data: realProducts, error } = await supabase
            .from('products')
            .select('id, name, price, stock')
            .in('id', productIds);

        if (error || !realProducts) {
            return NextResponse.json({ error: 'Error verificando catálogo de seguridad.' }, { status: 500 });
        }

        // 3. VERIFICAR STOCK Y CONSTRUIR ITEMS CON PRECIOS DEL SERVIDOR
        const verifiedItems: { id: string; name: string; price: number; quantity: number }[] = [];

        for (const cartItem of items) {
            const realProduct = realProducts.find(p => p.id === cartItem.id);
            if (!realProduct) {
                return NextResponse.json({ error: `Producto no encontrado: ${cartItem.id}` }, { status: 400 });
            }
            if (realProduct.stock < cartItem.quantity) {
                return NextResponse.json({ error: `Sin stock suficiente para: ${realProduct.name}` }, { status: 400 });
            }
            verifiedItems.push({
                id: realProduct.id,
                name: realProduct.name,
                price: realProduct.price,       // ✅ PRECIO 100% DEL SERVIDOR
                quantity: cartItem.quantity,
            });
        }

        // 4. CALCULAR TOTAL CON PRECIOS VERIFICADOS
        const total = verifiedItems
            .reduce((sum, item) => sum + (item.price * item.quantity), 0)
            .toFixed(2);

        // 5. Autenticación máquina-a-máquina con PayPal
        const accessToken = await getPayPalAccessToken();

        // 6. Crear Estructura de "Orden a Cobrar" con datos verificados
        const origin = new URL(req.url).origin; // ✅ Usar origin del servidor, no del cliente

        const orderPayload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: total,
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: total
                            }
                        }
                    },
                    items: verifiedItems.map((item) => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: "USD",
                            value: item.price.toFixed(2)  // ✅ Precio del servidor
                        },
                        quantity: String(item.quantity),
                        category: "PHYSICAL_GOODS"
                    })),
                    description: "Compra en Boutique Grecia Fashion Store"
                }
            ],
            application_context: {
                shipping_preference: "GET_FROM_FILE",
                user_action: "PAY_NOW",
                return_url: `${origin}/checkout/success`,
                cancel_url: `${origin}/checkout/canceled`
            }
        };

        const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderPayload)
        });

        if (!res.ok) {
            const errorDetails = await res.text();
            console.error("PayPal Order error:", errorDetails);
            return NextResponse.json({ error: "Fallo contactando a PayPal v2 API" }, { status: 500 });
        }

        const data = await res.json();
        return NextResponse.json({ orderID: data.id, links: data.links }, { status: 200 });

    } catch (err: unknown) {
        // ✅ R3: Reporte a Sentry en producción + log local
        Sentry.captureException(err, {
            tags: { endpoint: 'paypal_create_order', layer: 'payment' },
            extra: { ip },
        });
        console.error('PayPal Integration API Error:', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
