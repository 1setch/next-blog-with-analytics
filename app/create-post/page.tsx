'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  });

  useEffect(() => {
    // Проверяем авторизацию
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login');
        }
        setCheckingAuth(false);
      });
  }, []);

  if (checkingAuth) {
    return <div className="text-center p-8">Проверка авторизации...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim());
    
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, tags: tagsArray }),
    });
    
    if (res.ok) {
      router.push('/blog');
    } else {
      const error = await res.json();
      alert(error.error || 'Ошибка при создании поста');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Создать новый пост</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Заголовок</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border p-2 rounded-lg"
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Slug (URL)</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
            className="w-full border p-2 rounded-lg"
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
            className="w-full border p-2 rounded-lg"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Теги (через запятую)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full border p-2 rounded-lg"
            placeholder="react, nextjs, mongodb"
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium">Содержание</label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full border p-2 rounded-lg font-mono"
            rows={15}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Создание...' : 'Опубликовать'}
        </button>
      </form>
    </div>
  );
}