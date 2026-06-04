'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  authorName: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentsProps {
  postId: string;
}

export default function Comments({ postId }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Войдите чтобы оставить комментарий');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content: replyTo ? `@${replyTo.name} ${newComment}` : newComment,
          parentId: replyTo?.id || null,
        }),
      });

      if (res.ok) {
        toast.success('Комментарий добавлен');
        setNewComment('');
        setReplyTo(null);
        fetchComments();
      } else {
        toast.error('Ошибка при добавлении');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">
        Комментарии ({comments.length})
      </h3>

      {/* Форма добавления комментария */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <div className="mb-2 text-sm text-blue-600">
              Ответ @{replyTo.name}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Напишите комментарий..."
            className="w-full border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            <a href="/login" className="text-blue-600 hover:underline">Войдите</a> чтобы оставить комментарий
          </p>
        </div>
      )}

      {/* Список комментариев */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment._id} className="border rounded-lg p-4 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              {comment.author?.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt={comment.authorName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  {comment.authorName?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <span className="font-semibold">{comment.authorName}</span>
                <span className="text-xs text-gray-500 ml-2">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
            {user && (
              <button
                onClick={() => setReplyTo({ id: comment._id, name: comment.authorName })}
                className="text-sm text-gray-500 hover:text-blue-600"
              >
                Ответить
              </button>
            )}

            {/* Ответы */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-8 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                {comment.replies.map((reply) => (
                  <div key={reply._id} className="pt-2">
                    <div className="flex items-center gap-3 mb-1">
                      {reply.author?.avatar ? (
                        <img
                          src={reply.author.avatar}
                          alt={reply.authorName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                          {reply.authorName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-sm">{reply.authorName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Пока нет комментариев. Будьте первым!
        </div>
      )}
    </div>
  );
}