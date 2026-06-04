'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StatsCards from '@/components/admin/StatsCards';
import CustomLineChart from '@/components/admin/LineChart';
import CustomPieChart from '@/components/admin/PieChart';
import TopPosts from '@/components/admin/TopPosts';
import LikesStats from '@/components/admin/LikesStats';
import ActivityChart from '@/components/admin/ActivityChart';
import AdminSkeleton from '@/components/admin/AdminSkeleton';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Админ-панель</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Аналитика и управление блогом</p>
        </div>

        {/* Карточки со статистикой */}
        <StatsCards stats={stats} />

        {/* Новая секция - Статистика лайков */}
        <LikesStats stats={stats} />

        {/* График лайков по дням */}
        <div className="mb-8">
          <CustomLineChart
            data={stats.likesByDay || []}
            title="❤️ Динамика лайков по дням"
            dataKey="count"
            color="#ef4444"
          />
        </div>

        {/* Новый график активности */}
        <div className="mb-8">
          <ActivityChart activityData={stats.activityData || []} />
        </div>

        {/* Графики постов и пользователей */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CustomLineChart
            data={stats.postsByDay}
            title="📝 Посты по дням (последние 30 дней)"
            dataKey="count"
            color="#3b82f6"
          />
          <CustomLineChart
            data={stats.usersByDay}
            title="👥 Новые пользователи по дням"
            dataKey="count"
            color="#10b981"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CustomPieChart
            data={stats.topTags}
            title="🏷️ Популярные теги"
          />
          <TopPosts 
            posts={stats.topPosts} 
            title="Топ постов по просмотрам" 
            icon="🔥" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPosts 
            posts={stats.topLikedPosts} 
            title="Топ постов по лайкам" 
            icon="❤️" 
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              👑 Топ авторов по лайкам
            </h3>
            <div className="space-y-3">
              {stats.topAuthorsByLikes?.map((author: any, index: number) => (
                <div key={author._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400">{index + 1}</span>
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
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">ℹ️ Общая информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Среднее количество постов на пользователя:</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.total.posts / stats.total.users).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Среднее количество просмотров на пост:</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.total.views / stats.total.posts).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Соотношение лайков к просмотрам:</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.total.engagementRate}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}