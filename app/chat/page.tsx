'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ChatTabs from '@/components/chat/ChatTabs';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-80px)] max-w-7xl mx-auto">
      <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <ChatTabs />
      </div>
    </div>
  );
}