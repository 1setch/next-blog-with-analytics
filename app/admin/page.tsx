'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatsCards from '@/components/admin/StatsCards';
import UnifiedChart from '@/components/admin/UnifiedChart';
import TopPosts from '@/components/admin/TopPosts';
import AdminSkeleton from '@/components/admin/AdminSkeleton';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: '',
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    
    if (!data.user || data.user.email !== 'admin@example.com') {
      router.push('/');
    }
  };

  const fetchStats = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      let url = '/api/admin/stats';
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchStats(dateRange.from, dateRange.to);
  };

  const resetFilter = () => {
    setDateRange({ from: '', to: '' });
    fetchStats();
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  if (!stats) {
    return (
      <div className="text-center p-8 text-gray-600 dark:text-gray-400">
        Нет данных для отображения
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Заголовок и кнопки управления */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Админ-панель</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Аналитика и управление блогом</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/users"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
            >
              👥 Управление пользователями
            </Link>
            <Link
              href="/admin/comments"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              💬 Модерация комментариев
            </Link>
          </div>
        </div>
    
        

        {/* Фильтр по дате */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                С даты
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                По дату
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button
              onClick={handleDateFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Применить
            </button>
            <button
              onClick={resetFilter}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              Сбросить
            </button>
          </div>
        </div>

        {/* Карточки со статистикой */}
        <StatsCards stats={stats} />

        {/* График активности пользователей по часам */}
        <div className="mb-8">
          <UnifiedChart
            type="area"
            data={stats.activityData || []}
            title="⏰ Активность пользователей по часам"
            dataKey="total"
            xAxisKey="hour"
            colors={['#3b82f6']}
            height={350}
          />
        </div>

        {/* Динамика лайков и комментариев */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UnifiedChart
            type="area"
            data={stats.likesByDay || []}
            title="❤️ Динамика лайков по дням"
            dataKey="count"
            xAxisKey="_id"
            colors={['#ef4444']}
            height={300}
          />
          <UnifiedChart
            type="area"
            data={stats.commentsByDay || []}
            title="💬 Динамика комментариев по дням"
            dataKey="count"
            xAxisKey="_id"
            colors={['#10b981']}
            height={300}
          />
        </div>

        {/* Посты и пользователи */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UnifiedChart
            type="bar"
            data={stats.postsByDay || []}
            title="📝 Новые посты по дням"
            dataKey="count"
            xAxisKey="_id"
            colors={['#3b82f6']}
            height={300}
          />
          <UnifiedChart
            type="bar"
            data={stats.usersByDay || []}
            title="👥 Новые пользователи по дням"
            dataKey="count"
            xAxisKey="_id"
            colors={['#8b5cf6']}
            height={300}
          />
        </div>

        {/* Чаты и сообщения */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              💬 Статистика чатов
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Всего сообщений в общем чате</span>
                <span className="text-2xl font-bold text-blue-600">{stats.totalPublicMessages || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Всего личных сообщений</span>
                <span className="text-2xl font-bold text-green-600">{stats.totalPrivateMessages || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Активных диалогов</span>
                <span className="text-2xl font-bold text-purple-600">{stats.activeDialogs || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Сообщений в день (в среднем)</span>
                <span className="text-2xl font-bold text-orange-600">{stats.avgMessagesPerDay || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              📊 Метрики вовлеченности
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Лайков на пост (в среднем)</span>
                <span className="text-2xl font-bold text-red-600">{stats.avgLikesPerPost || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Комментариев на пост</span>
                <span className="text-2xl font-bold text-green-600">{stats.avgCommentsPerPost || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Просмотров на пост</span>
                <span className="text-2xl font-bold text-blue-600">{stats.avgViewsPerPost || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Вовлеченность (лайки/просмотры)</span>
                <span className="text-2xl font-bold text-purple-600">{stats.engagementRate || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Популярные теги и часы активности */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <UnifiedChart
            type="pie"
            data={stats.topTags || []}
            title="🏷️ Популярные теги"
            dataKey="value"
            nameKey="name"
            height={350}
          />
          <UnifiedChart
            type="bar"
            data={stats.messageActivityByHour || []}
            title="💬 Активность в чатах по часам"
            dataKey="count"
            xAxisKey="hour"
            colors={['#f59e0b']}
            height={350}
          />
        </div>

        {/* Топ посты и авторы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TopPosts 
            posts={stats.topPosts || []} 
            title="🔥 Топ постов по просмотрам" 
            icon="👁️"
          />
          <TopPosts 
            posts={stats.topLikedPosts || []} 
            title="❤️ Топ постов по лайкам" 
            icon="❤️"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              👑 Топ авторов по лайкам
            </h3>
            <div className="space-y-3">
              {stats.topAuthorsByLikes?.map((author: any, index: number) => (
                <div key={author._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{author._id}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-sm text-red-500">❤️ {author.totalLikes}</span>
                    <span className="text-sm text-gray-500">📝 {author.postCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              💬 Топ авторов по комментариям
            </h3>
            <div className="space-y-3">
              {stats.topAuthorsByComments?.map((author: any, index: number) => (
                <div key={author._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{author._id}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-sm text-green-500">💬 {author.totalComments}</span>
                    <span className="text-sm text-gray-500">📝 {author.postCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ℹ️ Общая информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Среднее количество постов на пользователя:</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgPostsPerUser || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Среднее количество просмотров на пост:</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgViewsPerPost || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Соотношение лайков к просмотрам:</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.likesToViewsRatio || 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Активность сегодня:</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.todayActivity || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}