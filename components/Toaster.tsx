'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return <Toaster position="bottom-right" toastOptions={{
    duration: 3000,
    style: {
      background: '#363636',
      color: '#fff',
    },
    success: {
      duration: 2000,
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    },
    error: {
      duration: 3000,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    },
  }} />;
}