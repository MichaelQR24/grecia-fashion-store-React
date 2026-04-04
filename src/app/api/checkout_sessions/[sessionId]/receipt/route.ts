import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-02-25.clover',
});

export async function GET(req: Request, context: { params: Promise<{ sessionId: string }> }) {
    try {
        // En Next.js >14, parameters pueden ser asincrónicos, 
        // o si falla por destructuración extraemos desde la URL para mayor confiabilidad
        const { sessionId: paramId } = await context.params;
        let sessionId: string | undefined = paramId;
        
        if (!sessionId) {
            const url = new URL(req.url);
            const pathname = url.pathname;
            // Extraer el sessionId desde el formato de ruta /api/checkout_sessions/[sessionId]/receipt
            const match = pathname.match(/checkout_sessions\/(cs_[^/]+)/);
            if (match && match[1]) {
                sessionId = match[1];
            }
        }

        if (!sessionId) {
            return new NextResponse('Session ID no provisto o no encontrado en URL.', { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent.latest_charge']
        });

        const charge = (session.payment_intent as Stripe.PaymentIntent | null)?.latest_charge as Stripe.Charge | null;

        if (charge && charge.receipt_url) {
            return NextResponse.redirect(charge.receipt_url);
        } else {
             // Si el modo de prueba falla en capturar un receipt_url, enviamos un mensaje de ayuda
            return new NextResponse(`
                <html>
                <body style="font-family: sans-serif; padding: 40px; text-align: center; color: #382b28; background: #e5d5c5;">
                    <h2>Recibo Aún No Generado</h2>
                    <p>El recibo para la sesión <b>${sessionId}</b> no está disponible o el pago aún está en proceso de verificación por Stripe.</p>
                    <p><em>Nota para desarrollo: En modo de prueba, algunos eventos de pago pueden tardar o requerir configuración de facturación en tu dashboard de Stripe.</em></p>
                    <button onclick="window.close()" style="margin-top:20px; padding: 10px 20px; background: #382b28; color: #e5d5c5; border: none; border-radius: 20px; cursor: pointer;">Cerrar Pestaña</button>
                </body>
                </html>
            `, { status: 404, headers: { 'Content-Type': 'text/html' }});
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error obteniendo recibo de Stripe:', error);
        return new NextResponse(`
                <html>
                <body style="font-family: sans-serif; padding: 40px; text-align: center; color: #382b28; background: #eacbd0;">
                    <h2>Fallo de Conexión a Stripe</h2>
                    <p>${errorMessage || 'La sesión proporcionada podría ser inválida o muy antigua.'}</p>
                    <button onclick="window.close()" style="margin-top:20px; padding: 10px 20px; background: #382b28; color: #e5d5c5; border: none; border-radius: 20px; cursor: pointer;">Cerrar Pestaña</button>
                </body>
                </html>
            `, { status: 500, headers: { 'Content-Type': 'text/html' } });
    }
}
