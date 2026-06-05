'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import EditProfileModal from '@/components/EditProfileModal';
import ProfileSkeleton from '@/components/Skeleton/ProfileSkeleton';
import { useAuth } from '@/context/AuthContext';
import AuthorStats from '@/components/AuthorStats';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  createdAt: string;
  author: User;
  views: number;
  tags: string[];
  likesCount: number;
  status?: string;
}

export default function UserPage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, refetchUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([]);
  const [draftPosts, setDraftPosts] = useState<Post[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'stats'>('published');

  // Загрузка данных пользователя
  const fetchUserData = useCallback(async () => {
    setLoadingUser(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoadingUser(false);
    }
  }, [userId]);

  // Загрузка опубликованных постов
  const fetchPublishedPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts?authorId=${userId}&status=published&limit=50`);
      const data = await res.json();
      setPublishedPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching published posts:', error);
    }
  }, [userId]);

  // Загрузка черновиков (только для владельца)
  const fetchDraftPosts = useCallback(async () => {
    if (!isOwner) return;
    
    try {
      const res = await fetch(`/api/posts?authorId=${userId}&status=draft&limit=50`);
      const data = await res.json();
      setDraftPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching draft posts:', error);
    }
  }, [userId, isOwner]);

  // Публикация черновика
  const publishDraft = async (slug: string) => {
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      
      if (res.ok) {
        toast.success('Пост опубликован!');
        // Обновляем списки
        await fetchPublishedPosts();
        await fetchDraftPosts();
      } else {
        toast.error('Ошибка публикации');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  // Удаление черновика
  const deleteDraft = async (slug: string) => {
    if (!confirm('Удалить черновик?')) return;
    
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Черновик удален');
        await fetchDraftPosts();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка сервера');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchPublishedPosts();
    }
  }, [userId, fetchUserData, fetchPublishedPosts]);

  useEffect(() => {
    if (currentUser && user) {
      const owner = currentUser._id === user._id;
      setIsOwner(owner);
      if (owner) {
        fetchDraftPosts();
      }
    }
  }, [currentUser, user, fetchDraftPosts]);

  useEffect(() => {
    const loadingComplete = () => {
      setLoadingPosts(false);
    };
    
    if (activeTab === 'published' || (activeTab === 'drafts' && isOwner)) {
      // Ждем загрузки
      const timer = setTimeout(loadingComplete, 500);
      return () => clearTimeout(timer);
    } else {
      setLoadingPosts(false);
    }
  }, [publishedPosts, draftPosts, activeTab, isOwner]);

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await refetchUser();
  };

  if (loadingUser) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Пользователь не найден</h2>
        <Link href="/" className="text-blue-600 hover:underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Информация о пользователе */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            {user.avatar && user.avatar !== '/default-avatar.png' ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-blue-500 text-white">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
                <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition"
                >
                  ✏️ Редактировать профиль
                </button>
              )}
            </div>

            {user.bio && (
              <p className="mt-3 text-gray-700 dark:text-gray-300">{user.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              {user.location && <span>📍 {user.location}</span>}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  🔗 {user.website}
                </a>
              )}
              <span>📅 Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>

            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              📝 {publishedPosts.length} {publishedPosts.length === 1 ? 'пост' : publishedPosts.length < 5 ? 'поста' : 'постов'}
              {isOwner && draftPosts.length > 0 && `, 📝 Черновиков: ${draftPosts.length}`}
            </div>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b dark:border-gray-700 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('published')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'published'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📝 Опубликованные ({publishedPosts.length})
        </button>
        {isOwner && (
          <>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'drafts'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📄 Черновики ({draftPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 font-medium transition ${
                activeTab === 'stats'
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📊 Статистика
            </button>
          </>
        )}
      </div>

      {/* Опубликованные посты */}
      {activeTab === 'published' && (
        loadingPosts ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : publishedPosts.length > 0 ? (
          <div className="space-y-6">
            {publishedPosts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Нет опубликованных постов</p>
            {isOwner && (
              <Link
                href="/create-post"
                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Создать первый пост →
              </Link>
            )}
          </div>
        )
      )}

      {/* Черновики */}
      {activeTab === 'drafts' && isOwner && (
        loadingPosts ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              </div>
            ))}
          </div>
        ) : draftPosts.length > 0 ? (
          <div className="space-y-4">
            {draftPosts.map((draft) => (
              <div key={draft._id} className="border rounded-lg p-4 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/blog/${draft.slug}`}>
                      <h3 className="text-xl font-semibold hover:text-blue-600">
                        {draft.title || 'Без названия'}
                      </h3>
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">
                      {draft.description || 'Нет описания'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Создан: {new Date(draft.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/edit-post/${draft.slug}`}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      ✏️ Редактировать
                    </Link>
                    <button
                      onClick={() => publishDraft(draft.slug)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      📤 Опубликовать
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.slug)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Нет черновиков</p>
            <Link
              href="/create-post"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Создать черновик →
            </Link>
          </div>
        )
      )}

      {/* Статистика */}
      {activeTab === 'stats' && isOwner && <AuthorStats />}

      {/* Модалка редактирования */}
      {showEditModal && user && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
}