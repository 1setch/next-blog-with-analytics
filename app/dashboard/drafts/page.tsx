'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Draft {
  _id: string;
  title: string;
  slug: string;
  description: string;
  updatedAt: string;
  status: string;
}

export default function DraftsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user]);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/posts?status=draft');
      const data = await res.json();
      setDrafts(data.posts || []);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const publishDraft = async (slug: string) => {
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      
      if (res.ok) {
        toast.success('Пост опубликован!');
        fetchDrafts();
      } else {
        toast.error('Ошибка публикации');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  const deleteDraft = async (slug: string) => {
    if (!confirm('Удалить черновик?')) return;
    
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Черновик удален');
        fetchDrafts();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  if (loading || loadingDrafts) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📝 Черновики</h1>
        <Link
          href="/create-post"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          + Новый пост
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500">У вас нет черновиков</p>
          <Link href="/create-post" className="text-blue-600 hover:underline mt-2 inline-block">
            Создать первый пост →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft._id} className="border rounded-lg p-4 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link href={`/blog/${draft.slug}`}>
                    <h2 className="text-xl font-semibold hover:text-blue-600">{draft.title}</h2>
                  </Link>
                  <p className="text-gray-500 text-sm mt-1">{draft.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Обновлен: {new Date(draft.updatedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/edit-post/${draft.slug}`}
                    className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-700"
                  >
                    ✏️ Редактировать
                  </Link>
                  <button
                    onClick={() => publishDraft(draft.slug)}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                  >
                    📤 Опубликовать
                  </button>
                  <button
                    onClick={() => deleteDraft(draft.slug)}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}