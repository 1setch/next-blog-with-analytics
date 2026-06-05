'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import NewChatButton from './NewChatButton';
import { Search, X } from 'lucide-react';

interface Dialog {
  _id: string;
  username: string;
  avatar?: string;
  lastMessage: {
    content: string;
    createdAt: string;
    fromUserId: string;
  };
  unreadCount: number;
}

interface ChatSidebarProps {
  onSelectUser: (userId: string, username: string) => void;
  selectedUserId: string | null;
  refreshTrigger?: number;
}

export default function ChatSidebar({ onSelectUser, selectedUserId, refreshTrigger }: ChatSidebarProps) {
  const { user } = useAuth();
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isMounted = useRef(true);

  const fetchDialogs = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      const res = await fetch('/api/chat/private');
      const data = await res.json();
      if (isMounted.current) {
        setDialogs(data.dialogs || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching dialogs:', error);
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchDialogs();
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchDialogs]);

  useEffect(() => {
    if (refreshTrigger) {
      fetchDialogs();
    }
  }, [refreshTrigger, fetchDialogs]);

  const filteredDialogs = dialogs.filter(dialog =>
    dialog.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} ч`;
    return `${days} д`;
  };

  const handleSelectUser = (userId: string, username: string) => {
    onSelectUser(userId, username);
  };

  if (loading) {
    return (
      <div className="h-full">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 border-b dark:border-gray-700 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Поиск */}
      <div className="p-3 border-b dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск диалогов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Кнопка нового сообщения */}
      <div className="border-b dark:border-gray-700">
        <NewChatButton onSelectUser={handleSelectUser} />
      </div>

      {/* Список диалогов */}
      <div className="flex-1 overflow-y-auto">
        {filteredDialogs.length === 0 ? (
          <div className="text-center text-gray-500 py-8 px-4">
            {searchQuery ? (
              <>
                <p className="text-lg mb-2">😕</p>
                <p>Ничего не найдено</p>
                <p className="text-sm mt-1">Попробуйте другой поисковый запрос</p>
              </>
            ) : (
              <>
                <p className="text-lg mb-2">💬</p>
                <p>Нет диалогов</p>
                <p className="text-sm mt-1">Нажмите "Новое сообщение" чтобы начать</p>
              </>
            )}
          </div>
        ) : (
          filteredDialogs.map((dialog) => (
            <button
              key={dialog._id}
              onClick={() => handleSelectUser(dialog._id, dialog.username)}
              className={`w-full p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition active:bg-gray-100 dark:active:bg-gray-600 ${
                selectedUserId === dialog._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Аватар */}
                <div className="relative flex-shrink-0">
                  {dialog.avatar ? (
                    <img
                      src={dialog.avatar}
                      alt={dialog.username}
                      className="w-12 h-12 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {dialog.username[0]?.toUpperCase()}
                    </div>
                  )}
                  {dialog.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                      {dialog.unreadCount > 99 ? '99+' : dialog.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {dialog.username}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(dialog.lastMessage.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {dialog.lastMessage.fromUserId === user?._id ? 'Вы: ' : ''}
                    {dialog.lastMessage.content}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}