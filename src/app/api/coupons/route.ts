import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/permissions';

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey, {
    apiVersion: '2026-02-25.clover',
}) : null;

// ✅ Verificación de sesión y rol de administrador
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Acceso denegado. No hay sesión válida.' };

    if (!isAdmin(user)) {
        return { error: 'Privilegios insuficientes. Sólo administradores pueden gestionar cupones.' };
    }
    return { success: true };
}

// OBTENER TODOS LOS CÓDIGOS PROMOCIONALES
export async function GET() {
    const auth = await verifyAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

    if (!stripe) {
        return NextResponse.json([]); // Return empty list if no stripe configured
    }
    
    try {
        // Obtenemos los códigos promocionales (incluyen el código real que escribe el cliente)
        const promoCodes = await stripe.promotionCodes.list({ limit: 100, expand: ['data.promotion.coupon'] });

        // Formateamos para devolver al panel de React
        const formattedCoupons = await Promise.all(promoCodes.data.map(async (promo) => {
            const coupon = promo.promotion.coupon as Stripe.Coupon;

            // Descripción para mostrar si es % o monto fijo
            let discountText = '';
            if (coupon.percent_off) {
                discountText = `${coupon.percent_off}% OFF`;
            } else if (coupon.amount_off) {
                discountText = `$${(coupon.amount_off / 100).toFixed(2)} OFF`;
            }

            return {
                id: promo.id,
                code: promo.code,
                discountText,
                description: coupon.name || 'Sin descripción',
                isActive: promo.active,
                maxUses: promo.max_redemptions || 1000000,
                uses: promo.times_redeemed || 0,
                expiresAt: promo.expires_at ? new Date(promo.expires_at * 1000).toISOString() : null
            };
        }));

        return NextResponse.json(formattedCoupons);

    } catch (err: unknown) {
        console.error('Fetch Coupons Error:', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// CREAR NUEVO CÓDIGO PROMOCIONAL EN STRIPE
export async function POST(req: Request) {
    const auth = await verifyAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

    if (!stripe) return NextResponse.json({ error: 'Falta STRIPE_SECRET_KEY en las variables de entorno' }, { status: 500 });
    try {
        const body = await req.json();
        const { code, discountText, maxUses, description, expiryDate } = body;

        // 1. Detectar si el usuario mandó % o Monto Fijo ($)
        const isPercent = discountText.includes('%');
        const numericValue = parseFloat(discountText.replace(/[^0-9.]/g, ''));

        if (isNaN(numericValue) || numericValue <= 0) {
            return NextResponse.json({ error: 'El valor del descuento debe contener un número válido (Ej: 20% o 15)' }, { status: 400 });
        }

        // 2. Crear el Coupon Base en Stripe
        const couponParams: Stripe.CouponCreateParams = {
            name: description,
            duration: 'once', // El descuento aplica 1 vez a la orden
            max_redemptions: parseInt(maxUses) || undefined,
        };

        if (isPercent) {
            couponParams.percent_off = numericValue;
        } else {
            couponParams.amount_off = Math.round(numericValue * 100); // Stripe requiere centavos
            couponParams.currency = 'usd';
        }

        // Parsear fecha de expiración si la hay
        if (expiryDate) {
            const unixTime = Math.floor(new Date(expiryDate).getTime() / 1000);
            if (unixTime > Math.floor(Date.now() / 1000)) {
                couponParams.redeem_by = unixTime;
            }
        }

        const stripeCoupon = await stripe.coupons.create(couponParams);

        // 3. Crear el Promotion Code (El texto que ingresa el usuario)
        const promoParams: Stripe.PromotionCodeCreateParams = {
            promotion: {
                coupon: stripeCoupon.id,
                type: 'coupon'
            },
            code: code.toUpperCase(),
            active: true,
        };

        if (parseInt(maxUses) > 0) {
            promoParams.max_redemptions = parseInt(maxUses);
        }
        if (expiryDate) {
            const unixTime = Math.floor(new Date(expiryDate).getTime() / 1000);
            if (unixTime > Math.floor(Date.now() / 1000)) {
                promoParams.expires_at = unixTime;
            }
        }

        const promotionCode = await stripe.promotionCodes.create(promoParams);

        return NextResponse.json({ success: true, promotionCode });

    } catch (err: unknown) {
        console.error('Stripe Coupon Create Error:', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// ACTUALIZAR ESTADO (ACTIVAR/DESACTIVAR) O INVALIDAR
export async function PATCH(req: Request) {
    const auth = await verifyAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

    if (!stripe) return NextResponse.json({ error: 'Falta STRIPE_SECRET_KEY en las variables de entorno' }, { status: 500 });
    try {
        const body = await req.json();
        const { id, active } = body; // "id" aquí es el ID del PromotionCode de Stripe (promo_xxxx)

        const updatedPromo = await stripe.promotionCodes.update(id, {
            active: active,
        });

        return NextResponse.json({ success: true, updatedPromo });

    } catch (err: unknown) {
        console.error('Stripe Coupon Update Error:', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

// STRIPE NO PERMITE ELIMINAR PROMOTION CODES ASÍ DE FÁCIL POR MOTIVOS CONTABLES.
// SÓLO PERMITE DESACTIVARLOS (PATCH a active: false), LO CUAL YA HACEMOS.
// Pero expondremos la ruta para simplemente "ocultarlo" o ponerlo inactivo.
export async function DELETE(req: Request) {
    const auth = await verifyAdmin();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 403 });

    if (!stripe) return NextResponse.json({ error: 'Falta STRIPE_SECRET_KEY en las variables de entorno' }, { status: 500 });
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Falta el ID del código' }, { status: 400 });

        // Lo Desactivamos definitivamente (simula el borrado)
        const updatedPromo = await stripe.promotionCodes.update(id, {
            active: false,
        });

        return NextResponse.json({ success: true, updatedPromo });

    } catch (err: unknown) {
        console.error('Stripe Promo Delete Error', err);
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

