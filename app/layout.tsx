import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import ScrollObserver from '@/components/ScrollObserver';
import { AuthProvider } from '@/context/AuthContext';
import ToastProvider from '@/components/Toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LikesProvider } from '@/context/LikesContext';

export const metadata: Metadata = {
  title: 'Блог на Next.js',
  description: 'Блог с авторизацией и постами',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-50">
        <ThemeProvider>
          <AuthProvider>
            <LikesProvider>
              <Header />
              <ProgressBar />
              <ToastProvider />
              <main>{children}</main>
            </LikesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}