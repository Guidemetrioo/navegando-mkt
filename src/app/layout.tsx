import type { Metadata, Viewport } from 'next';
import './globals.css';
import './design-system.css';
import './control-center.css';
import { DesignAppearance } from '@/components/design/DesignSelector';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export const metadata: Metadata = {
  title: 'Navegando MKT • Sistema Operacional',
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
    <html lang="pt-BR" data-design="control" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--ui-page)] text-[var(--ui-text)] font-sans antialiased selection:bg-[var(--ui-accent)]/30 selection:text-foreground">
        <DesignAppearance />
        {children}
      </body>
    </html>
  );
}
