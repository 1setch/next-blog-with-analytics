'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import PublicChat from '@/components/chat/PublicChat';
import { Menu, ArrowLeft, MessageCircle, Users } from 'lucide-react';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSelectUser = (userId: string, username: string) => {
    setSelectedUser({ id: userId, name: username });
    setActiveTab('private');
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
        {/* Вкладки для десктопа */}
        <div className="hidden md:flex border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={() => {
              setActiveTab('public');
              setSelectedUser(null);
            }}
            className={`flex-1 px-4 py-3 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'public'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Общий чат
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`flex-1 px-4 py-3 font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'private'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Личные сообщения
          </button>
        </div>

        {/* Мобильная навигация */}
        <div className="md:hidden flex items-center gap-2 p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {activeTab === 'private' && !showSidebar && selectedUser ? (
            <>
              <button
                onClick={handleBackToDialogs}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="font-semibold text-gray-900 dark:text-white">
                Чат с {selectedUser.name}
              </span>
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setActiveTab('public');
                  setSelectedUser(null);
                }}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                  activeTab === 'public'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Общий
              </button>
              <button
                onClick={() => setActiveTab('private')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                  activeTab === 'private'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Личные
              </button>
            </div>
          )}
        </div>

        {/* Содержимое */}
        <div className="h-[calc(100%-57px)] md:h-[calc(100%-57px)]">
          {activeTab === 'public' ? (
            <PublicChat />
          ) : (
            <div className="flex h-full">
              {/* Левая панель - диалоги */}
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
                  onMessageSent={() => {}}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}