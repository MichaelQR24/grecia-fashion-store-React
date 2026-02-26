import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Row,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface ReceiptEmailProps {
    customerName: string;
    orderId: string;
    items: {
        name: string;
        price: number;
        quantity: number;
        image?: string;
    }[];
    total: number;
}

export const ReceiptEmail = ({
    customerName = "Cliente Fashion",
    orderId = "ODR-0000",
    items = [],
    total = 0,
}: ReceiptEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Tu recibo de compra en Grecia Fashion Store</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={headerTitle}>Grecia Fashion Store</Heading>
                    </Section>

                    <Section style={messageSection}>
                        <Text style={greeting}>¡Hola, {customerName}!</Text>
                        <Text style={message}>
                            Gracias por tu compra. Estamos procesando tu pedido cuidadosamente. Aquí tienes el resumen de tu transacción.
                        </Text>
                        <Text style={orderIdText}>Pedido: <strong>{orderId}</strong></Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={itemsSection}>
                        {items.map((item, index) => (
                            <Row key={index} style={itemRow}>
                                <Column style={{ width: "20%" }}>
                                    {item.image ? (
                                        <Img src={item.image} width="50" height="50" style={itemImage} alt={item.name} />
                                    ) : (
                                        <div style={placeholderImage} />
                                    )}
                                </Column>
                                <Column style={{ width: "60%" }}>
                                    <Text style={itemName}>{item.name}</Text>
                                    <Text style={itemSub}>Cantidad: {item.quantity}</Text>
                                </Column>
                                <Column style={{ width: "20%", textAlign: "right" }}>
                                    <Text style={itemPrice}>${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                                </Column>
                            </Row>
                        ))}
                    </Section>

                    <Hr style={divider} />

                    <Section style={totalSection}>
                        <Row>
                            <Column style={{ width: "70%" }}>
                                <Text style={totalLabel}>TOTAL PAGADO</Text>
                            </Column>
                            <Column style={{ width: "30%", textAlign: "right" }}>
                                <Text style={totalValue}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Section style={footer}>
                        <Text style={footerText}>
                            Si tienes alguna pregunta sobre tu pedido, no dudes en <Link href="mailto:soporte@greciafashion.com" style={footerLink}>contactarnos</Link>.
                        </Text>
                        <Text style={footerTextSmall}>
                            &copy; {new Date().getFullYear()} Grecia Fashion Store. Todos los derechos reservados.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default ReceiptEmail;

// Estilos limpios y estéticos
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "40px auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    width: "600px",
    maxWidth: "100%",
};

const header = {
    padding: "32px",
    backgroundColor: "#111111",
    textAlign: "center" as const,
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
};

const headerTitle = {
    color: "#DDA7A5",
    fontSize: "24px",
    margin: "0",
    fontWeight: "300",
    fontFamily: "Georgia, serif",
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
};

const messageSection = {
    padding: "32px",
};

const greeting = {
    fontSize: "18px",
    color: "#333",
    fontWeight: "bold",
    margin: "0 0 12px",
};

const message = {
    fontSize: "16px",
    color: "#555",
    lineHeight: "24px",
    margin: "0 0 20px",
};

const orderIdText = {
    fontSize: "14px",
    color: "#777",
    margin: "0",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
};

const itemsSection = {
    padding: "0 32px",
};

const itemRow = {
    borderBottom: "1px solid #eee",
    paddingValue: "16px 0",
};

const itemImage = {
    borderRadius: "4px",
    objectFit: "cover" as const,
};

const placeholderImage = {
    width: "50px",
    height: "50px",
    backgroundColor: "#eee",
    borderRadius: "4px",
};

const itemName = {
    fontSize: "15px",
    color: "#333",
    fontWeight: "bold",
    margin: "0 0 4px",
};

const itemSub = {
    fontSize: "13px",
    color: "#888",
    margin: "0",
};

const itemPrice = {
    fontSize: "15px",
    color: "#111",
    fontWeight: "bold",
    margin: "0",
};

const divider = {
    borderTop: "1px solid #eaeaea",
    margin: "24px 0",
};

const totalSection = {
    padding: "0 32px",
};

const totalLabel = {
    fontSize: "16px",
    color: "#333",
    fontWeight: "bold",
    margin: "0",
};

const totalValue = {
    fontSize: "20px",
    color: "#DDA7A5",
    fontWeight: "bold",
    margin: "0",
};

const footer = {
    padding: "32px 32px 0",
    textAlign: "center" as const,
};

const footerText = {
    fontSize: "14px",
    color: "#888",
    lineHeight: "22px",
    margin: "0 0 12px",
};

const footerLink = {
    color: "#DDA7A5",
    textDecoration: "none",
};

const footerTextSmall = {
    fontSize: "12px",
    color: "#aaa",
    margin: "0",
};
