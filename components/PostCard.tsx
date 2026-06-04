'use client';

import Link from 'next/link';
import { useLikes } from '@/context/LikesContext';
import { useEffect } from 'react';

interface PostCardProps {
  post: any;
}

export default function PostCard({ post }: PostCardProps) {
  const { likedPosts, likesCount, toggleLike } = useLikes();
  
  const isLiked = likedPosts[post._id] || false;
  const likeCount = likesCount[post._id] ?? post.likesCount ?? 0;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleLike(post._id, post.slug);
  };

  return (
    <article className="post-card border rounded-lg p-6 hover:shadow-lg transition bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <Link href={`/blog/${post.slug}`}>
        <h2 className="text-2xl font-bold mb-2 hover:text-blue-600 dark:hover:text-blue-400 text-gray-900 dark:text-white">
          {post.title}
        </h2>
      </Link>
      
      <div className="flex items-center gap-4 text-sm mb-3 text-gray-600 dark:text-gray-400">
        <Link 
          href={`/user/${post.author._id}`} 
          className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
        >
          {post.author.avatar && post.author.avatar !== '/default-avatar.png' ? (
            <img 
              src={post.author.avatar} 
              alt={post.author.username}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              {post.author.username?.[0]?.toUpperCase()}
            </div>
          )}
          <span>{post.author.username}</span>
        </Link>
        <span>📅 {new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
        <span>👁️ {post.views}</span>
        <button 
          onClick={handleLike}
          className="flex items-center gap-1 hover:text-red-500 transition"
        >
          <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
          <span>{likeCount}</span>
        </button>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">{post.description}</p>
      
      <div className="flex gap-2 flex-wrap">
        {post.tags?.slice(0, 3).map((tag: string) => (
          <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}