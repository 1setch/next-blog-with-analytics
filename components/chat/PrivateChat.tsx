'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

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
  const isMounted = useRef(true);
  const isAdmin = user?.email === 'admin@example.com';

  const fetchMessages = useCallback(async () => {
    if (!selectedUser || !isMounted.current) return;
    
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
  }, [selectedUser?.id]);

  // Подписка на Pusher
  useEffect(() => {
    if (!selectedUser || !user) return;
    
    isMounted.current = true;
    fetchMessages();
    
    const initPusher = async () => {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      if (!pusherKey) return;
      
      const PusherClient = (await import('pusher-js')).default;
      const pusherClient = new PusherClient(pusherKey, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
      
      const channelName = `private-chat-${user._id}-${selectedUser.id}`;
      const channel = pusherClient.subscribe(channelName);
      
      channel.bind('new-message', (newMessage: Message) => {
        setMessages(prev => [...prev, newMessage]);
        setTimeout(scrollToBottom, 100);
      });
      
      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        pusherClient.disconnect();
      };
    };
    
    const cleanup = initPusher();
    return () => {
      isMounted.current = false;
      cleanup.then(fn => fn?.());
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <p>Выберите диалог или начните новый</p>
          <p className="text-sm mt-2">Нажмите "Новое сообщение" в левой панели</p>
        </div>
      </div>
    );
  }

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
    <div className="flex-1 flex flex-col h-full">
      {/* Заголовок */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
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
          <div className="text-center text-gray-500 py-8">
            Нет сообщений. Напишите что-нибудь!
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
                    className={`max-w-[70%] p-3 rounded-lg relative ${
                      msg.fromUserId === user?._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="text-sm break-words">{msg.content}</div>
                    <div className={`text-xs mt-1 ${msg.fromUserId === user?._id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                      {msg.fromUserId === user?._id && msg.read && ' ✓✓'}
                    </div>
                    
                    {canDelete(msg) && (
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600 transition"
                      >
                        ✕
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
      <div className="p-4 border-t dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-800">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={`Сообщение для ${selectedUser.name}...`}
          maxLength={500}
          className="flex-1 border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
        >
          {sending ? '...' : '📤'}
        </button>
      </div>
    </div>
  );
}