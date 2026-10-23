import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryProvider } from '@/shared/components/providers/QueryProvider';
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
      <body className="antialiased">
        <AntdRegistry>
          <QueryProvider>{children}</QueryProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
