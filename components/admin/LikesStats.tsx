'use client';

import Link from 'next/link';

interface LikesStatsProps {
  stats: {
    total: {
      likes: number;
      avgLikesPerPost: number;
      engagementRate: string;
    };
    topLikedPosts: any[];
    topAuthorsByLikes: any[];
  };
}

export default function LikesStats({ stats }: LikesStatsProps) {
  // Добавляем проверки на существование данных
  const totalLikes = stats?.total?.likes || 0;
  const avgLikesPerPost = stats?.total?.avgLikesPerPost || 0;
  const engagementRate = stats?.total?.engagementRate || '0';
  const topLikedPosts = stats?.topLikedPosts || [];
  const topAuthorsByLikes = stats?.topAuthorsByLikes || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        ❤️ Статистика лайков
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {totalLikes.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Всего лайков</div>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {avgLikesPerPost}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">В среднем на пост</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {engagementRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Вовлеченность (лайки/просмотры)</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Топ постов по лайкам */}
        {topLikedPosts.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">🏆 Топ постов по лайкам</h4>
            <div className="space-y-2">
              {topLikedPosts.map((post: any, index: number) => (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="truncate text-gray-700 dark:text-gray-300">{post.title}</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-red-500">❤️ {post.likesCount || 0}</span>
                    <span className="text-gray-500">👁️ {post.views || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Топ авторов по лайкам */}
        {topAuthorsByLikes.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">👑 Топ авторов по лайкам</h4>
            <div className="space-y-2">
              {topAuthorsByLikes.map((author: any, index: number) => (
                <div
                  key={author._id}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{author._id}</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-red-500">❤️ {author.totalLikes}</span>
                    <span className="text-gray-500">📝 {author.postCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}