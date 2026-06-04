'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EditPostModalProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    tags: string[];
  };
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditPostModal({ post, onClose, onUpdate }: EditPostModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: post.title,
    description: post.description,
    content: post.content,
    tags: post.tags.join(', ')
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim());
    
    try {
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          description: formData.description,
          tags: tagsArray
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        onUpdate(); // Обновляем данные
        onClose(); // Закрываем модалку
        router.refresh(); // Обновляем страницу
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Редактировать пост</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Заголовок</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Краткое описание</label>
              <textarea
                required
                maxLength={200}
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Теги (через запятую)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="react, nextjs, mongodb"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Содержание</label>
              <textarea
                required
                rows={15}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full border rounded-lg p-2 font-mono"
              />
            </div>
            
            {error && <p className="text-red-600 text-sm">{error}</p>}
            
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}