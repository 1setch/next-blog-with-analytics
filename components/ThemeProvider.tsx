'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // После монтирования на клиенте, показываем детей
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Возвращаем детей без провайдера темы на сервере
    return <>{children}</>;
  }

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemeProvider>
  );
}