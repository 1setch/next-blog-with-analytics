'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/Skeleton/PostCardSkeleton';
import { useLikes } from '@/context/LikesContext';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchLikesForPosts } = useLikes();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts?limit=50');
      const data = await res.json();
      setPosts(data.posts);
      // Загружаем лайки для всех постов одним запросом
      await fetchLikesForPosts(data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Все посты</h1>
          <div className="bg-gray-200 rounded w-32 h-10"></div>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Все посты ({posts.length})</h1>
        <Link
          href="/create-post"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + Новый пост
        </Link>
      </div>

      <div className="space-y-6">
        {posts.map((post: any) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}