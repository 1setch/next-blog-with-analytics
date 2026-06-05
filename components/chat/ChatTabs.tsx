'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import PublicChat from './PublicChat';
import PrivateChat from './PrivateChat';
import ChatSidebar from './ChatSidebar';

export default function ChatTabs() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [refreshSidebar, setRefreshSidebar] = useState(0);

  const handleSelectUser = useCallback((userId: string, username: string) => {
    setSelectedUser({ id: userId, name: username });
  }, []);

  const handleMessageSent = useCallback(() => {
    // Обновляем список диалогов
    setRefreshSidebar(prev => prev + 1);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Вкладки */}
      <div className="flex border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => {
            setActiveTab('public');
            setSelectedUser(null);
          }}
          className={`flex-1 px-4 py-3 font-medium transition ${
            activeTab === 'public'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          🌍 Общий чат
        </button>
        <button
          onClick={() => setActiveTab('private')}
          className={`flex-1 px-4 py-3 font-medium transition ${
            activeTab === 'private'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          💬 Личные сообщения
        </button>
      </div>

      {/* Содержимое */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'public' ? (
          <PublicChat />
        ) : (
          <div className="flex h-full">
            {/* Левая панель - диалоги */}
            <div className="w-80 flex-shrink-0 border-r dark:border-gray-700">
              <ChatSidebar 
                onSelectUser={handleSelectUser}
                selectedUserId={selectedUser?.id || null}
                refreshTrigger={refreshSidebar}
              />
            </div>
            {/* Правая панель - окно чата */}
            <div className="flex-1">
              <PrivateChat 
                selectedUser={selectedUser}
                onMessageSent={handleMessageSent}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}