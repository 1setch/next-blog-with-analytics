'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function NavigationLogger() {
  const pathname = usePathname();
  
  useEffect(() => {
    console.log('🌍 Навигация на страницу:', pathname);
  }, [pathname]);
  
  return null;
}