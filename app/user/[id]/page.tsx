'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import EditProfileModal from '@/components/EditProfileModal';
import ProfileSkeleton from '@/components/Skeleton/ProfileSkeleton';
import { useAuth } from '@/context/AuthContext';
import AuthorStats from '@/components/AuthorStats';

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
  createdAt: string;
  author: User;
  views: number;
  tags: string[];
}

export default function UserPage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, refetchUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (currentUser && user) {
      setIsOwner(currentUser._id === user._id);
    }
  }, [currentUser, user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      setUser(data.user);

      const postsRes = await fetch(`/api/posts?authorId=${userId}&limit=50`);
      const postsData = await postsRes.json();
      setPosts(postsData.posts || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await refetchUser();
  };

  if (loading) {
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
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                <h1 className="text-3xl font-bold">{user.username}</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
              {isOwner && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
                >
                  ✏️ Редактировать профиль
                </button>
              )}
            </div>

            {user.bio && (
              <p className="mt-3 text-gray-700">{user.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
              {user.location && (
                <span>📍 {user.location}</span>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  🔗 {user.website}
                </a>
              )}
              <span>📅 Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>

            <div className="mt-3 text-sm text-gray-500">
              📝 {posts.length} {posts.length === 1 ? 'пост' : posts.length < 5 ? 'поста' : 'постов'}
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Посты {user.username}</h2>
      {isOwner && <AuthorStats />}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post}  />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">У пользователя пока нет постов</p>
          {isOwner && (
            <Link
              href="/create-post"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Создать первый пост →
            </Link>
          )}
        </div>
      )}

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