'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AuthorStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
      setLoading(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="animate-pulse text-gray-600 dark:text-gray-400">Загрузка статистики...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">📊 Моя статистика</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalPosts}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Постов</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalViews}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Просмотров</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalLikes}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Лайков</div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.avgViewsPerPost}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">В среднем</div>
        </div>
      </div>
      
      {stats.topPosts && stats.topPosts.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">🏆 Топ постов</h3>
          <div className="space-y-2">
            {stats.topPosts.map((post: any) => (
              <Link 
                key={post._id} 
                href={`/blog/${post.slug}`} 
                className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
              >
                <span className="truncate flex-1 text-gray-700 dark:text-gray-300">{post.title}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{post.views} 👁️</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}