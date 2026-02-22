import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AppProvider } from "@/context/AppContext";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Grecia Fashion Store | Boutique",
  description: "Boutique Exclusiva de moda para mujeres en New Jersey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${poppins.variable} scroll-smooth`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased font-sans text-white bg-black">
        <AppProvider>
          <Header />
          {children}
          <Footer />

          {/* Botón Flotante WhatsApp */}
          <a href="https://wa.me/15512538886?text=Hola,%20quisiera%20asesoría%20sobre%20Grecia%20Fashion" target="_blank" rel="noopener noreferrer" className="float-wa" title="Asesoría Personalizada">
            <i className="fab fa-whatsapp text-2xl"></i>
          </a>
        </AppProvider>
      </body>
    </html>
  );
}
