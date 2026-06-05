'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export default function EditProfileModal({ user, onClose, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    avatar: user.avatar || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('📱 EditProfileModal рендер, user:', user);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFormData(prev => ({ ...prev, avatar: data.url }));
        toast.success('Аватар обновлен');
      } else {
        setError(data.error || 'Ошибка загрузки');
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch (err) {
      setError('Upload failed');
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('📤 Отправка данных:', formData);
    
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      console.log('📥 Ответ:', data);
      
      if (res.ok) {
        toast.success('Профиль обновлен');
        onUpdate(data.user);
        onClose();
      } else {
        setError(data.error || 'Ошибка обновления');
        toast.error(data.error || 'Ошибка обновления');
      }
    } catch (err) {
      setError('Ошибка сервера');
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Редактировать профиль</h2>
            <button 
              onClick={() => {
                console.log('❌ Закрытие модалки');
                onClose();
              }} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Аватар */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {formData.avatar && formData.avatar !== '/default-avatar.png' ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-blue-500 text-white">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 text-xs hover:bg-blue-700"
                  disabled={uploading}
                >
                  {uploading ? '⏳' : '📷'}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Загрузка...</p>}
            </div>
            
            {/* Имя пользователя */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Имя пользователя
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* О себе */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                О себе
              </label>
              <textarea
                maxLength={200}
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Расскажите о себе..."
              />
              <p className="text-xs text-gray-500">{formData.bio.length}/200</p>
            </div>
            
            {/* Местоположение */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Местоположение
              </label>
              <input
                type="text"
                maxLength={100}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Город, страна"
              />
            </div>
            
            {/* Сайт */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Сайт
              </label>
              <input
                type="url"
                maxLength={200}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            
            {error && <p className="text-red-600 text-sm">{error}</p>}
            
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  console.log('❌ Отмена');
                  onClose();
                }}
                className="flex-1 border rounded-lg py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition disabled:opacity-50"
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