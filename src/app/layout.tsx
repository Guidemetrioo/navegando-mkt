import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import './globals.css';
import './design-system.css';
import { DesignAppearance } from '@/components/design/DesignSelector';

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

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

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
    <html lang="pt-BR" data-design="operations" suppressHydrationWarning className={`${bricolage.variable} ${instrument.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "(function(){try{var d=localStorage.getItem('navegando-design');document.documentElement.dataset.design=['editorial','operations'].includes(d)?d:'operations'}catch(e){document.documentElement.dataset.design='operations'}})()" }} />
      </head>
      <body className="min-h-screen bg-[var(--ui-page)] text-[var(--ui-text)] font-sans antialiased selection:bg-[var(--ui-accent)]/30 selection:text-foreground">
        <DesignAppearance />
        {children}
      </body>
    </html>
  );
}
