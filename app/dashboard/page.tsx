'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/user/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">📊 Моя статистика</h1>

      {/* Карточки */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats?.totalPosts || 0}</div>
          <div className="text-gray-600 dark:text-gray-400">Постов</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats?.totalViews || 0}</div>
          <div className="text-gray-600 dark:text-gray-400">Просмотров</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats?.totalLikes || 0}</div>
          <div className="text-gray-600 dark:text-gray-400">Лайков</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats?.avgViewsPerPost || 0}</div>
          <div className="text-gray-600 dark:text-gray-400">В среднем</div>
        </div>
      </div>

      {/* Топ постов */}
      {stats?.topPosts?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🏆 Топ постов</h2>
          <div className="space-y-3">
            {stats.topPosts.map((post: any, index: number) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-bold">#{index + 1}</span>
                  <span>{post.title}</span>
                </div>
                <span>{post.views} 👁️</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ссылки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/create-post"
          className="bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg transition"
        >
          + Новый пост
        </Link>
        <Link
          href={`/user/${user._id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg transition"
        >
          👤 Мой профиль
        </Link>
      </div>
    </div>
  );
}