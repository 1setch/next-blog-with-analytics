'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Send, Trash2 } from 'lucide-react';

interface Message {
  _id: string;
  username: string;
  userId?: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

export default function PublicChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.email === 'admin@example.com';
  const pusherChannelRef = useRef<any>(null);
  const pusherClientRef = useRef<any>(null);
  const isMounted = useRef(true);

  const fetchMessages = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      const res = await fetch('/api/chat?limit=50');
      const data = await res.json();
      if (isMounted.current) {
        setMessages(data.messages || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (isMounted.current) setLoading(false);
    }
  }, []);

  // Подписка на Pusher
  useEffect(() => {
    isMounted.current = true;
    fetchMessages();
    
    let isActive = true;
    let intervalId: NodeJS.Timeout | null = null;
    
    const initPusher = async () => {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      
      if (!pusherKey) {
        // Fallback polling
        intervalId = setInterval(() => {
          if (isMounted.current) {
            fetchMessages();
          }
        }, 3000);
        return;
      }

      try {
        const PusherClient = (await import('pusher-js')).default;
        
        if (!pusherClientRef.current) {
          const client = new PusherClient(pusherKey, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            forceTLS: true,
          });
          pusherClientRef.current = client;
        }
        
        if (!isActive || !isMounted.current) return;
        
        const channel = pusherClientRef.current.subscribe('chat-channel');
        pusherChannelRef.current = channel;
        
        channel.bind('pusher:subscription_succeeded', () => {
          console.log('✅ Подписан на общий чат канал');
        });
        
        channel.bind('new-message', (newMessage: Message) => {
          console.log('📨 Новое сообщение в общем чате:', newMessage);
          if (isMounted.current) {
            setMessages(prev => {
              if (prev.some(m => m._id === newMessage._id)) return prev;
              return [...prev, newMessage];
            });
            setTimeout(scrollToBottom, 100);
          }
        });
        
        channel.bind('pusher:subscription_error', (error: any) => {
          console.error('❌ Ошибка подписки на общий чат:', error);
        });
      } catch (error) {
        console.error('Pusher initialization error:', error);
      }
    };
    
    initPusher();
    
    return () => {
      isActive = false;
      isMounted.current = false;
      if (intervalId) clearInterval(intervalId);
      if (pusherChannelRef.current) {
        try {
          pusherChannelRef.current.unbind_all();
          pusherChannelRef.current.unsubscribe();
        } catch (e) {
          console.warn('Error unsubscribing from channel:', e);
        }
        pusherChannelRef.current = null;
      }
      // Не отключаем клиент полностью
    };
  }, [fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user) {
      toast.error('Войдите чтобы отправить сообщение');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage('');
        if (inputRef.current) inputRef.current.focus();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Удалить сообщение?')) return;
    
    try {
      const res = await fetch(`/api/chat?messageId=${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
        toast.success('Сообщение удалено');
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
  };

  const canDelete = (message: Message) => {
    return isAdmin || message.userId === user?._id;
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-start animate-pulse">
            <div className="max-w-[70%]">
              <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-10 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">🌍 Общий чат</h3>
        <p className="text-sm text-gray-500">Общайтесь со всеми пользователями</p>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Пока нет сообщений</p>
              <p className="text-sm mt-1">Будьте первым!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="text-center my-4">
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {date}
                </span>
              </div>
              {dateMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.userId === user?._id ? 'justify-end' : 'justify-start'} mb-3 group`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl relative ${
                      msg.userId === user?._id
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    {msg.userId !== user?._id && (
                      <div className="flex items-center gap-2 mb-1">
                        {msg.avatar ? (
                          <img 
                            src={msg.avatar} 
                            alt={msg.username} 
                            className="w-5 h-5 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            {msg.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {msg.username}
                        </div>
                      </div>
                    )}
                    <div className="text-sm break-words whitespace-pre-wrap">{msg.content}</div>
                    <div className={`text-xs mt-1 ${msg.userId === user?._id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </div>
                    
                    {canDelete(msg) && (
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-7 h-7 text-xs flex items-center justify-center hover:bg-red-600 transition shadow-md"
                        aria-label="Удалить сообщение"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      {user ? (
        <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef as any}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Напишите сообщение..."
              maxLength={500}
              rows={1}
              className="flex-1 border rounded-2xl p-3 max-h-32 resize-none dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Отправить"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">
            {newMessage.length}/500
          </div>
        </div>
      ) : (
        <div className="p-4 border-t dark:border-gray-700 text-center text-sm text-gray-500 bg-white dark:bg-gray-800">
          <a href="/login" className="text-blue-600 hover:underline">Войдите</a> чтобы участвовать в чате
        </div>
      )}
    </div>
  );
}