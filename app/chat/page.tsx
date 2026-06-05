'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { Menu, ArrowLeft } from 'lucide-react';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // На мобилке: при выборе пользователя скрываем сайдбар
  const handleSelectUser = (userId: string, username: string) => {
    setSelectedUser({ id: userId, name: username });
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleBackToDialogs = () => {
    setSelectedUser(null);
    setShowSidebar(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-80px)] max-w-7xl mx-auto">
      <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        {/* Мобильная навигация */}
        <div className="md:hidden flex items-center gap-2 p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {!showSidebar && selectedUser ? (
            <>
              <button
                onClick={handleBackToDialogs}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Назад к диалогам"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="font-semibold text-gray-900 dark:text-white">
                Чат с {selectedUser.name}
              </span>
            </>
          ) : (
            <>
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="font-semibold text-gray-900 dark:text-white">Сообщения</span>
            </>
          )}
        </div>

        <div className="flex h-full">
          {/* Левая панель - список диалогов */}
          <div className={`
            w-full md:w-80 md:flex-shrink-0 border-r dark:border-gray-700
            transition-transform duration-300 ease-in-out
            ${showSidebar ? 'block' : 'hidden md:block'}
          `}>
            <ChatSidebar 
              onSelectUser={handleSelectUser}
              selectedUserId={selectedUser?.id || null}
            />
          </div>
          
          {/* Правая панель - окно чата */}
          <div className={`
            flex-1 transition-all duration-300
            ${!showSidebar ? 'block' : 'hidden md:block'}
          `}>
            <ChatWindow 
              selectedUser={selectedUser}
              onMessageSent={() => {
                // Обновляем список диалогов
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}