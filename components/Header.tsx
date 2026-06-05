'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import NotificationsPopover from './NotificationsPopover';

export default function Header() {
  const { user, loading, refetchUser } = useAuth();
  const router = useRouter();
  const isAdmin = user?.email === 'admin@example.com';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refetchUser();
    router.push('/');
    router.refresh();
    setMobileMenuOpen(false);
  };

  // Показываем скелетон во время загрузки
  if (loading) {
    return (
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-md">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">Блог</div>
          <div className="hidden md:flex gap-6 items-center">
            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-md transition-colors duration-200">
      <nav className="max-w-6xl mx-auto px-4 py-3 md:py-4">
        {/* Верхняя строка с логотипом и кнопками */}
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
            Блог
          </Link>

          {/* Десктопное меню */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
              Главная
            </Link>
            <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
              Блог
            </Link>
            <Link href="/search" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
              🔍 Поиск
            </Link>
            <Link href="/chat" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
              💬 Чат
            </Link>

            {isAdmin && (
              <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-gray-700 dark:text-gray-300">
                📊 Админка
              </Link>
            )}

            {user ? (
              <>
                <Link href="/create-post" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition text-sm">
                  + Пост
                </Link>
                <Link href={`/user/${user._id}`} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  {user.avatar && user.avatar !== '/default-avatar.png' ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{user.username}</span>
                </Link>
                <button onClick={handleLogout} className="text-red-600 dark:text-red-400 hover:text-red-700">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
                  Войти
                </Link>
                <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition text-sm">
                  Регистрация
                </Link>
              </>
            )}

            <ThemeToggle />
            <NotificationsPopover />
          </div>

          {/* Мобильные элементы */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <NotificationsPopover />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Меню"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <Link
              href="/"
              className="block hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Главная
            </Link>
            <Link
              href="/blog"
              className="block hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Блог
            </Link>
            <Link
              href="/search"
              className="block hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              🔍 Поиск
            </Link>
            <Link
              href="/chat"
              className="block hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              💬 Чат
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="block hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-gray-700 dark:text-gray-300 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                📊 Админка
              </Link>
            )}

            {user ? (
              <>
                <Link
                  href="/create-post"
                  className="block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  + Новый пост
                </Link>
                <Link
                  href={`/user/${user._id}`}
                  className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user.avatar && user.avatar !== '/default-avatar.png' ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="truncate">{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-red-600 dark:text-red-400 hover:text-red-700 py-2"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}