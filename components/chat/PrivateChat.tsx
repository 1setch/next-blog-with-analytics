'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Send, Trash2, CheckCheck, Check } from 'lucide-react';

interface Message {
  _id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  toUserId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface PrivateChatProps {
  selectedUser: { id: string; name: string } | null;
  onMessageSent?: () => void;
}

export default function PrivateChat({ selectedUser, onMessageSent }: PrivateChatProps) {
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
    if (!selectedUser || !user || !isMounted.current) return;
    
    try {
      const res = await fetch(`/api/chat/private?withUserId=${selectedUser.id}`);
      const data = await res.json();
      if (isMounted.current) {
        setMessages(data.messages || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (isMounted.current) setLoading(false);
    }
  }, [selectedUser?.id, user?._id]);

  // Подписка на Pusher - только когда выбран пользователь
  useEffect(() => {
    // Закрываем предыдущие соединения
    if (pusherChannelRef.current) {
      pusherChannelRef.current.unbind_all();
      pusherChannelRef.current.unsubscribe();
      pusherChannelRef.current = null;
    }
    if (pusherClientRef.current) {
      pusherClientRef.current.disconnect();
      pusherClientRef.current = null;
    }
    
    if (!selectedUser || !user) return;
    
    isMounted.current = true;
    fetchMessages();
    
    let isActive = true;
    
    const initPusher = async () => {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      if (!pusherKey) {
        console.warn('Pusher not configured - using polling');
        // Fallback polling
        const interval = setInterval(() => {
          if (isMounted.current && selectedUser) {
            fetchMessages();
          }
        }, 3000);
        return () => clearInterval(interval);
      }
      
      try {
        const PusherClient = (await import('pusher-js')).default;
        
        // Создаем новый клиент только если нет активного
        if (!pusherClientRef.current) {
          const client = new PusherClient(pusherKey, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            forceTLS: true,
            authEndpoint: '/api/pusher/auth',
            auth: {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          });
          
          client.connection.bind('state_change', (states: any) => {
            console.log('Pusher connection state:', states.current);
          });
          
          pusherClientRef.current = client;
        }
        
        if (!isActive || !isMounted.current) return;
        
        const channelName = `private-chat-${user._id}-${selectedUser.id}`;
        const channel = pusherClientRef.current.subscribe(channelName);
        pusherChannelRef.current = channel;
        
        channel.bind('pusher:subscription_succeeded', () => {
          console.log('✅ Подписан на канал:', channelName);
        });
        
        channel.bind('new-message', (newMessage: Message) => {
          console.log('📨 Новое сообщение через Pusher:', newMessage);
          if (isMounted.current) {
            setMessages(prev => {
              if (prev.some(m => m._id === newMessage._id)) return prev;
              return [...prev, newMessage];
            });
            setTimeout(scrollToBottom, 100);
          }
        });
        
        channel.bind('pusher:subscription_error', (error: any) => {
          console.error('❌ Ошибка подписки на канал:', error);
        });
      } catch (error) {
        console.error('Pusher initialization error:', error);
      }
    };
    
    const cleanupPromise = initPusher();
    
    return () => {
      isActive = false;
      isMounted.current = false;
      if (pusherChannelRef.current) {
        pusherChannelRef.current.unbind_all();
        pusherChannelRef.current.unsubscribe();
        pusherChannelRef.current = null;
      }
      // Не отключаем клиент полностью, чтобы не создавать его заново
    };
  }, [selectedUser?.id, user?._id, fetchMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    if (!user) {
      toast.error('Войдите чтобы отправить сообщение');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/chat/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: selectedUser.id, content: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage('');
        onMessageSent?.();
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
      const res = await fetch(`/api/chat/private?messageId=${messageId}`, { method: 'DELETE' });
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
    return isAdmin || message.fromUserId === user?._id;
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium">Выберите диалог</p>
          <p className="text-sm mt-1">или начните новый через кнопку "Новое сообщение"</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-pulse`}>
            <div className="max-w-[70%]">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
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
    <div className="flex-1 flex flex-col h-full">
      {/* Заголовок */}
      <div className="hidden md:flex p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {selectedUser.name[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h3>
            <p className="text-xs text-gray-500">Личный чат</p>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Нет сообщений</p>
              <p className="text-sm mt-1">Напишите что-нибудь, чтобы начать диалог</p>
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
                  className={`flex ${msg.fromUserId === user?._id ? 'justify-end' : 'justify-start'} mb-3 group`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl relative ${
                      msg.fromUserId === user?._id
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${
                      msg.fromUserId === user?._id ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      <span>{formatTime(msg.createdAt)}</span>
                      {msg.fromUserId === user?._id && (
                        msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                      )}
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
      <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef as any}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder={`Сообщение для ${selectedUser.name}...`}
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
    </div>
  );
}