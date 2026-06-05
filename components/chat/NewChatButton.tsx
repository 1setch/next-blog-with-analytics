'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface User {
  _id: string;
  username: string;
  avatar?: string;
}

interface NewChatButtonProps {
  onSelectUser: (userId: string, username: string) => void;
}

export default function NewChatButton({ onSelectUser }: NewChatButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/list');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) &&
    u._id !== user?._id
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600 transition"
      >
        <span className="text-xl">+</span>
        <span>Новое сообщение</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Выберите пользователя
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {search ? 'Пользователи не найдены' : 'Нет других пользователей'}
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => {
                        onSelectUser(u._id, u.username);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 transition"
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {u.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-gray-900 dark:text-white">{u.username}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}