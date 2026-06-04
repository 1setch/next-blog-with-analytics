'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

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
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        onUpdate(data.user);
        onClose();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Редактировать профиль</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {formData.avatar && formData.avatar !== '/default-avatar.png' ? (
                    <Image
                      src={formData.avatar}
                      alt="Avatar"
                      fill
                      className="object-cover"
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
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 text-xs"
                  disabled={uploading}
                >
                  📷
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
            
            <div>
              <label className="block text-sm font-medium mb-1">Имя пользователя</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border rounded-lg p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">О себе</label>
              <textarea
                maxLength={200}
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Расскажите о себе..."
              />
              <p className="text-xs text-gray-500">{formData.bio.length}/200</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Местоположение</label>
              <input
                type="text"
                maxLength={100}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Город, страна"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Сайт</label>
              <input
                type="url"
                maxLength={200}
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="https://..."
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
                disabled={loading || uploading}
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