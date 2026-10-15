import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-title',
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Navegando MKT • Agenda da equipe',
  description: 'Quem grava, onde e para qual cliente, em cada dia.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${instrument.variable}`}>
      <body className="min-h-screen bg-[#0e0f12] text-[#f4f4f5] font-sans antialiased selection:bg-[#FF5A3C]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
