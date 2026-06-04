'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import EditPostModal from '@/components/EditPostModal';
import PostPageSkeleton from '@/components/Skeleton/PostPageSkeleton';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Comments from '@/components/Comments';

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
    bio?: string;
  };
  tags: string[];
  views: number;
  likesCount: number;
  createdAt: string;
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchCurrentUser();
  }, [slug]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch(`/api/posts/${slug}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${post?.title}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Ошибка при создании PDF');
    }
  };

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${slug}`);
      const data = await res.json();
      setPost(data);
      setLikesCount(data.likesCount || 0);

      // Проверяем лайк
      const likeRes = await fetch(`/api/posts/${slug}/like`);
      const likeData = await likeRes.json();
      setLiked(likeData.liked);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && post) {
      setIsOwner(currentUser._id === post.author?._id);
    }
  }, [currentUser, post]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Войдите чтобы поставить лайк');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${slug}/like`, { method: 'POST' });
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      toast(data.liked ? '❤️ Вы лайкнули пост' : '💔 Вы убрали лайк');
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;

    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });

      if (res.ok) {
        toast.success('Пост удален');
        router.push('/blog');
        router.refresh();
      } else {
        toast.error('Ошибка при удалении');
      }
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  const handleUpdate = async () => {
    await fetchPost();
    router.refresh();
  };

  if (loading) {
    return <PostPageSkeleton />;
  }

  if (!post) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Пост не найден</h2>
        <Link href="/blog" className="text-blue-600 hover:underline">
          ← Вернуться к списку постов
        </Link>
      </div>
    );
  }

  if (!post.author) {
    return <div className="text-center p-8">Ошибка: автор не найден</div>;
  }

  return (
    <article className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-start mb-6">
        <Link href="/blog" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Назад ко всем постам
        </Link>
        <button
          onClick={downloadPDF}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
        >
          📄 PDF
        </button>
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              ✏️ Редактировать
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              🗑️ Удалить
            </button>
          </div>
        )}
      </div>

      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Link href={`/user/${post.author._id}`} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
          {post.author.avatar && post.author.avatar !== '/default-avatar.png' ? (
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              {post.author.username?.[0]?.toUpperCase()}
            </div>
          )}
          <span>{post.author.username}</span>
        </Link>
        <span>📅 {new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
        <span>👁️ {post.views} просмотров</span>
        <button
          onClick={handleLike}
          className="flex items-center gap-1 hover:text-red-500 transition"
        >
          <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
          <span>{likesCount}</span>
        </button>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag: string) => (
            <span key={tag} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="prose prose-lg max-w-none dark:prose-invert">
        {post.content.split('\n').map((paragraph: string, i: number) => (
          paragraph.trim() && <p key={i}>{paragraph}</p>
        ))}
      </div>

      {post.author && (
        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {post.author.avatar && post.author.avatar !== '/default-avatar.png' ? (
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                {post.author.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <Link href={`/user/${post.author._id}`} className="font-semibold text-lg hover:text-blue-600 dark:hover:text-blue-400 text-gray-900 dark:text-white">
                {post.author.username}
              </Link>
              {post.author.bio && <p className="text-gray-600 dark:text-gray-400 text-sm">{post.author.bio}</p>}
            </div>
          </div>
        </div>
      )}
      <Comments postId={post._id} />
      {showEditModal && post && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </article>
  );
}