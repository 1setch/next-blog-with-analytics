'use client';

import Link from 'next/link';

interface TopPostsProps {
  posts: any[];
  title?: string;  // ← добавляем title как опциональный
  icon?: string;   // ← добавляем icon
}

export default function TopPosts({ posts, title = "Топ постов", icon = "🔥" }: TopPostsProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{icon} {title}</h3>
        <p className="text-gray-500 text-center">Нет данных</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{icon} {title}</h3>
      <div className="space-y-3">
        {posts.map((post, index) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug}`}
            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
              <span className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</span>
            </div>
            <div className="flex gap-3 text-sm">
              {post.likesCount !== undefined && (
                <span className="text-red-500">❤️ {post.likesCount}</span>
              )}
              {post.views !== undefined && (
                <span className="text-gray-500">👁️ {post.views}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}