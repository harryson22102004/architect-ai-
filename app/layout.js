import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ArchitectAI — Generate full-stack architecture with Gemini',
  description:
    'Describe your software idea. Get a Prisma schema, REST API plan, and visual architecture diagram instantly, powered by Google Gemini.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className + ' bg-background text-foreground antialiased'}>
        {children}
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
