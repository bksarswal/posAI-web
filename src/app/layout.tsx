import type { Metadata } from 'next';
import { AppProviders } from '@/shared/components/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'POSAI',
  description: 'Restaurant POS SaaS Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
