'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { refetchUser } = useAuth(); // ← Добавляем refetchUser
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Регистрация успешна!');
        await refetchUser(); // ← Обновляем контекст
        router.push('/');
        router.refresh(); // ← Принудительно обновляем страницу
      } else {
        toast.error(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Регистрация</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Имя пользователя</label>
          <input
            type="text"
            required
            minLength={3}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        
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
            minLength={6}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block mb-1 text-gray-700 dark:text-gray-300">Подтвердите пароль</label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full border rounded-lg p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      
      <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
        Уже есть аккаунт? <Link href="/login" className="text-blue-600 hover:underline">Войти</Link>
      </p>
    </div>
  );
}