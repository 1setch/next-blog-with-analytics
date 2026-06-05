'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  type: 'comment' | 'like' | 'reply';
  sourceId: string;
  sourceSlug?: string;
  sourceTitle?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    if (unreadIds.length === 0) return;

    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Обновляем счетчик непрочитанных
        const newUnreadCount = notifications.filter(n => n._id !== notificationId && !n.read).length;
        setUnreadCount(newUnreadCount);
        toast.success('Уведомление удалено');
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const getNotificationText = (notif: Notification) => {
    switch (notif.type) {
      case 'comment':
        return `💬 Новый комментарий: "${notif.sourceTitle || ''}"`;
      case 'like':
        return `❤️ Лайк на посте: "${notif.sourceTitle || ''}"`;
      case 'reply':
        return `↩️ Ответ на ваш комментарий: "${notif.sourceTitle || ''}"`;
      default:
        return `📢 Новое уведомление`;
    }
  };

  const getNotificationLink = (notif: Notification) => {
    // Используем sourceSlug
    if (notif.sourceSlug) {
      return `/blog/${notif.sourceSlug}`;
    }
    // Если нет slug, но sourceId не выглядит как ObjectId
    if (notif.sourceId && !notif.sourceId.match(/^[0-9a-f]{24}$/)) {
      return `/blog/${notif.sourceId}`;
    }
    return '/';
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAsRead();
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="Уведомления"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
          <div className="p-3 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Уведомления</h3>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
                  if (unreadIds.length > 0) {
                    await markAsRead();
                    toast.success('Все уведомления прочитаны');
                  }
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Прочитать все
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Нет уведомлений
              </div>
            ) : (
              notifications.map((notif) => {
                const link = getNotificationLink(notif);
                return (
                  <div
                    key={notif._id}
                    className={`group relative p-3 border-b dark:border-gray-700 transition ${
                      !notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Link
                      href={link}
                      className="block pr-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {getNotificationText(notif)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.createdAt).toLocaleString('ru-RU')}
                      </p>
                    </Link>
                    <button
                      onClick={() => deleteNotification(notif._id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                      aria-label="Удалить уведомление"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}