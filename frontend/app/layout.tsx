import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tiempo de Dios Cursos',
  description: 'Plataforma de cursos bíblicos — Tiempo de Dios, Santiago de Chile',
  icons: {
    icon: [
      { url: '/brand/icon-globe-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon-globe-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/brand/icon-globe-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Tiempo de Dios Cursos',
    description: 'Plataforma de cursos bíblicos — Tiempo de Dios, Santiago de Chile',
    siteName: 'Tiempo de Dios',
    locale: 'es_CL',
    type: 'website',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Tiempo de Dios' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
