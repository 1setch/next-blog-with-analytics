'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  username: string;
  userId?: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

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

interface PrivateMessage {
  _id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export default function Chat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  
  // Общий чат
  const [publicMessages, setPublicMessages] = useState<Message[]>([]);
  const [newPublicMessage, setNewPublicMessage] = useState('');
  const [sendingPublic, setSendingPublic] = useState(false);
  
  // Личные сообщения
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [newPrivateMessage, setNewPrivateMessage] = useState('');
  const [sendingPrivate, setSendingPrivate] = useState(false);
  const [users, setUsers] = useState<{ _id: string; username: string; avatar?: string }[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка публичных сообщений
  const fetchPublicMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat?limit=50');
      const data = await res.json();
      setPublicMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching public messages:', error);
    }
  }, []);

  // Загрузка диалогов
  const fetchDialogs = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/private');
      const data = await res.json();
      setDialogs(data.dialogs || []);
    } catch (error) {
      console.error('Error fetching dialogs:', error);
    }
  }, []);

  // Загрузка переписки с выбранным пользователем
  const fetchPrivateMessages = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/chat/private?withUserId=${userId}`);
      const data = await res.json();
      setPrivateMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching private messages:', error);
    }
  }, []);

  // Загрузка списка пользователей
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users/list');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Отправка публичного сообщения
  const sendPublicMessage = async () => {
    if (!newPublicMessage.trim()) return;
    if (!user) {
      toast.error('Войдите чтобы отправить сообщение');
      return;
    }

    setSendingPublic(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPublicMessage.trim() }),
      });

      if (res.ok) {
        setNewPublicMessage('');
        await fetchPublicMessages();
        setTimeout(scrollToBottom, 100);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setSendingPublic(false);
    }
  };

  // Отправка личного сообщения
  const sendPrivateMessage = async () => {
    if (!newPrivateMessage.trim() || !selectedUser) return;
    if (!user) {
      toast.error('Войдите чтобы отправить сообщение');
      return;
    }

    setSendingPrivate(true);
    try {
      const res = await fetch('/api/chat/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: selectedUser.id, content: newPrivateMessage.trim() }),
      });

      if (res.ok) {
        setNewPrivateMessage('');
        await fetchPrivateMessages(selectedUser.id);
        await fetchDialogs();
        setTimeout(scrollToBottom, 100);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setSendingPrivate(false);
    }
  };

  // Выбор пользователя для ЛС
  const selectUser = async (userId: string, username: string) => {
    setSelectedUser({ id: userId, name: username });
    setShowUserList(false);
    await fetchPrivateMessages(userId);
    // Отмечаем сообщения как прочитанные
    await fetchDialogs();
    setTimeout(scrollToBottom, 100);
  };

  // Автообновление
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'public') {
        fetchPublicMessages();
        intervalRef.current = setInterval(fetchPublicMessages, 3000);
      } else {
        fetchDialogs();
        if (selectedUser) {
          fetchPrivateMessages(selectedUser.id);
          intervalRef.current = setInterval(() => {
            fetchPrivateMessages(selectedUser.id);
            fetchDialogs();
          }, 3000);
        } else {
          intervalRef.current = setInterval(fetchDialogs, 3000);
        }
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, activeTab, selectedUser, fetchPublicMessages, fetchDialogs, fetchPrivateMessages]);

  // Скролл вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [publicMessages, privateMessages, isOpen]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition z-50"
      >
        💬
      </button>
    );
  }

  const totalUnread = dialogs.reduce((sum, d) => sum + d.unreadCount, 0);

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[550px] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col z-50 border dark:border-gray-700">
      {/* Заголовок */}
      <div className="bg-blue-600 text-white rounded-t-lg">
        <div className="flex justify-between items-center p-3 border-b border-blue-700">
          <h3 className="font-semibold">💬 Чат</h3>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && activeTab === 'private' && (
              <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 rounded-full p-1 transition"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Вкладки */}
        <div className="flex">
          <button
            onClick={() => {
              setActiveTab('public');
              setSelectedUser(null);
            }}
            className={`flex-1 py-2 text-center transition ${activeTab === 'public' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            🌍 Общий чат
          </button>
          <button
            onClick={() => {
              setActiveTab('private');
              fetchUsers();
            }}
            className={`flex-1 py-2 text-center transition ${activeTab === 'private' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
          >
            💌 Личные сообщения
            {totalUnread > 0 && (
              <span className="ml-1 bg-red-500 px-1.5 py-0.5 rounded-full text-xs">
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Содержимое */}
      {activeTab === 'public' ? (
        // Общий чат
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {publicMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Пока нет сообщений. Будьте первым!
              </div>
            ) : (
              publicMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.userId === user?._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-2 rounded-lg ${
                      msg.userId === user?._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="text-xs opacity-75 mb-1 flex justify-between gap-2">
                      <span className="font-semibold">{msg.username}</span>
                      <span>{formatTime(msg.createdAt)}</span>
                    </div>
                    <div className="text-sm break-words">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {user ? (
            <div className="p-3 border-t dark:border-gray-700 flex gap-2">
              <input
                type="text"
                value={newPublicMessage}
                onChange={(e) => setNewPublicMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendPublicMessage()}
                placeholder="Напишите сообщение..."
                maxLength={500}
                className="flex-1 border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sendingPublic}
              />
              <button
                onClick={sendPublicMessage}
                disabled={sendingPublic || !newPublicMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {sendingPublic ? '...' : '📤'}
              </button>
            </div>
          ) : (
            <div className="p-3 border-t dark:border-gray-700 text-center text-sm text-gray-500">
              <a href="/login" className="text-blue-600 hover:underline">Войдите</a> чтобы участвовать в чате
            </div>
          )}
        </>
      ) : (
        // Личные сообщения
        <>
          {!selectedUser ? (
            // Список диалогов
            <div className="flex-1 overflow-y-auto">
              <button
                onClick={() => setShowUserList(true)}
                className="w-full p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
              >
                <span className="text-xl">+</span>
                <span>Новое сообщение</span>
              </button>
              
              {dialogs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Нет диалогов
                </div>
              ) : (
                dialogs.map((dialog) => (
                  <button
                    key={dialog._id}
                    onClick={() => selectUser(dialog._id, dialog.username)}
                    className="w-full p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-left flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{dialog.username}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {dialog.lastMessage.fromUserId === user?._id ? 'Вы: ' : ''}
                        {dialog.lastMessage.content}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">
                        {formatTime(dialog.lastMessage.createdAt)}
                      </div>
                      {dialog.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                          {dialog.unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            // Переписка с выбранным пользователем
            <>
              <div className="flex items-center gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setPrivateMessages([]);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Назад
                </button>
                <span className="font-semibold">{selectedUser.name}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {privateMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Нет сообщений. Напишите что-нибудь!
                  </div>
                ) : (
                  privateMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.fromUserId === user?._id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-2 rounded-lg ${
                          msg.fromUserId === user?._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-1 flex justify-between gap-2">
                          <span className="font-semibold">
                            {msg.fromUserId === user?._id ? 'Вы' : msg.fromUsername}
                          </span>
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                        <div className="text-sm break-words">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-3 border-t dark:border-gray-700 flex gap-2">
                <input
                  type="text"
                  value={newPrivateMessage}
                  onChange={(e) => setNewPrivateMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendPrivateMessage()}
                  placeholder={`Сообщение для ${selectedUser.name}...`}
                  maxLength={500}
                  className="flex-1 border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendingPrivate}
                />
                <button
                  onClick={sendPrivateMessage}
                  disabled={sendingPrivate || !newPrivateMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {sendingPrivate ? '...' : '📤'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Модалка выбора пользователя */}
      {showUserList && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg flex flex-col z-50">
          <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
            <h3 className="font-semibold">Выберите получателя</h3>
            <button
              onClick={() => setShowUserList(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u._id}
                onClick={() => selectUser(u._id, u.username)}
                className="w-full p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-left flex items-center gap-3"
              >
                {u.avatar ? (
                  <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {u.username[0]?.toUpperCase()}
                  </div>
                )}
                <span>{u.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}