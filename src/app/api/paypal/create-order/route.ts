import { NextResponse } from 'next/server';

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
    try {
        const { items } = await req.json();

        // 1. Calculamos el total estricto desde el Backend. (Nunca confiar en el valor del Front-End)
        const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2);

        // 2. Autenticación máquina-a-máquina con PayPal
        const accessToken = await getPayPalAccessToken();

        // 3. Crear Estructura de "Orden a Cobrar"
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
                    items: items.map((item: any) => ({
                        name: item.name,
                        unit_amount: {
                            currency_code: "USD",
                            value: item.price.toFixed(2)
                        },
                        quantity: String(item.quantity),
                        category: "PHYSICAL_GOODS"
                    })),
                    description: "Compra en Boutique Grecia Fashion Store"
                }
            ],
            application_context: {
                shipping_preference: "GET_FROM_FILE", // Que Paypal solicite y nos devuelva la dirección del usuario
                user_action: "PAY_NOW",
                return_url: `${req.headers.get("origin")}/checkout/success`,
                cancel_url: `${req.headers.get("origin")}/checkout/canceled`
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

    } catch (err: any) {
        console.error('PayPal Integration API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
