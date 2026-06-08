'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  content: string;
  authorName: string;
  author: { _id: string; username: string; avatar?: string };
  postId: { _id: string; title: string; slug: string };
  createdAt: string;
  isDeleted: boolean;
}

export default function AdminCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    checkAuth();
    fetchComments();
  }, []);

  const checkAuth = async () => {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    
    if (!data.user || data.user.email !== 'admin@example.com') {
      router.push('/');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch('/api/admin/comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Ошибка загрузки комментариев');
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Удалить этот комментарий?')) return;
    
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Комментарий удален');
        fetchComments();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const filteredComments = comments.filter(comment =>
    comment.content.toLowerCase().includes(search.toLowerCase()) ||
    comment.authorName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              💬 Модерация комментариев
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Всего комментариев: {comments.length}
            </p>
          </div>
          <Link
            href="/admin"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
          >
            ← Назад в админку
          </Link>
        </div>

        {/* Поиск */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="Поиск по тексту или автору..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Список комментариев */}
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div key={comment._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {comment.authorName[0]?.toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString('ru-RU')}
                    </span>
                    <span className="text-xs text-gray-400">→</span>
                    {comment.postId ? (
                      <Link
                        href={`/blog/${comment.postId.slug}`}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline truncate max-w-[300px]"
                      >
                        📄 {comment.postId.title}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Пост удален</span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
                <button
                  onClick={() => deleteComment(comment._id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-4 transition p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  title="Удалить комментарий"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredComments.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-500 dark:text-gray-400">
              {search ? 'Комментарии не найдены' : 'Пока нет комментариев'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}