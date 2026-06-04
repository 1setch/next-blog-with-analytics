'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, loading, refetchUser } = useAuth(); // ← Добавили loading
  const router = useRouter();
  const isAdmin = user?.email === 'admin@example.com';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refetchUser();
    router.push('/');
    router.refresh();
  };

  // Показываем скелетон во время загрузки
  if (loading) {
    return (
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-md">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">Блог</div>
          <div className="flex gap-6 items-center">
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
      <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Блог
        </Link>
        
        <div className="flex gap-6 items-center">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
            Главная
          </Link>
          <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
            Все посты
          </Link>
          
          {isAdmin && (
            <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-gray-700 dark:text-gray-300">
              📊 Админка
            </Link>
          )}
          
          {user ? (
            <>
              <Link href="/create-post" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
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
                <span>{user.username}</span>
              </Link>
              <button onClick={handleLogout} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-300">
                Войти
              </Link>
              <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                Регистрация
              </Link>
            </>
          )}
          
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}