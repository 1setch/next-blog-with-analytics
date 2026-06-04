'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface LikeButtonProps {
  postSlug: string;
  initialLikes?: number;
}

export default function LikeButton({ postSlug, initialLikes = 0 }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkLike = async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/posts/${postSlug}/like`);
        const data = await res.json();
        setLiked(data.liked);
        setLikes(data.likesCount);
      } catch (error) {
        console.error('Error checking like:', error);
      }
    };
    checkLike();
  }, [postSlug, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Войдите чтобы поставить лайк');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postSlug}/like`, { method: 'POST' });
      const data = await res.json();
      
      setLiked(data.liked);
      setLikes(data.likesCount);
      
      toast(data.liked ? '❤️ Вы лайкнули пост' : '💔 Вы убрали лайк');
    } catch (error) {
      toast.error('Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
        liked 
          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <span className="text-xl">{liked ? '❤️' : '🤍'}</span>
      <span>{likes}</span>
    </button>
  );
}