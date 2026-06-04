'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    tags: '',
    status: 'draft' // ← добавляем
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login');
        }
        setCheckingAuth(false);
      });
  }, []);

  // Автоматическая генерация slug из заголовка
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

  if (checkingAuth) {
    return <div className="text-center p-8">Проверка авторизации...</div>;
  }

  const handleSubmit = async (e: React.FormEvent, isPublished: boolean = true) => {
    e.preventDefault();
    setLoading(true);
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim());
    
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...formData, 
        tags: tagsArray,
        status: isPublished ? 'published' : 'draft'
      }),
    });
    
    if (res.ok) {
      const message = isPublished ? 'Пост опубликован!' : 'Черновик сохранен!';
      toast.success(message);
      router.push('/dashboard');
    } else {
      const error = await res.json();
      toast.error(error.error || 'Ошибка при создании поста');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Создать новый пост</h1>
      
      <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Заголовок</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800"
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Slug (URL)</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800"
          />
          <p className="text-sm text-gray-500">example: my-first-post</p>
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Краткое описание</label>
          <textarea
            required
            maxLength={200}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Теги (через запятую)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800"
            placeholder="react, nextjs, mongodb"
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Содержание</label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full border rounded-lg p-2 font-mono dark:bg-gray-800"
            rows={15}
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Публикация...' : 'Опубликовать'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить черновик'}
          </button>
        </div>
      </form>
    </div>
  );
}