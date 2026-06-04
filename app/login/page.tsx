'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { refetchUser } = useAuth(); // ← Добавляем refetchUser
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Успешный вход!');
        await refetchUser(); // ← Обновляем контекст
        router.push('/');
        router.refresh(); // ← Принудительно обновляем страницу
      } else {
        toast.error(data.error || 'Ошибка входа');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Вход</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Пароль</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      
      <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
        Нет аккаунта? <Link href="/register" className="text-blue-600 hover:underline">Регистрация</Link>
      </p>
    </div>
  );
}