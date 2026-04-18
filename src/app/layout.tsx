import type { Metadata } from "next";
import { Bebas_Neue, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["italic"],
});

export const metadata: Metadata = {
  title: "Xout | Travel Workout Ritual",
  description: "High-fidelity, zero-equipment workout rituals for travelers and hotel-room sessions.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebas.variable} ${geistMono.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
