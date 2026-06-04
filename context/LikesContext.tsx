'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface LikesContextType {
  likedPosts: Record<string, boolean>;
  likesCount: Record<string, number>;
  toggleLike: (postId: string, postSlug: string) => Promise<void>;
  fetchLikesForPosts: (posts: any[]) => void;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());

  // Загружаем лайки для постов
  const fetchLikesForPosts = async (posts: any[]) => {
    if (!user || posts.length === 0) return;
    
    const postIds = posts.map(p => p._id);
    const idsKey = postIds.sort().join(',');
    
    // Проверяем кэш
    const cached = sessionStorage.getItem(`likes-${idsKey}`);
    if (cached) {
      const data = JSON.parse(cached);
      setLikedPosts(prev => ({ ...prev, ...data.liked }));
      setLikesCount(prev => ({ ...prev, ...data.counts }));
      return;
    }
    
    try {
      const res = await fetch('/api/posts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds })
      });
      const data = await res.json();
      
      // Сохраняем в кэш на 5 минут
      sessionStorage.setItem(`likes-${idsKey}`, JSON.stringify({
        liked: data.liked,
        counts: data.counts
      }));
      
      setLikedPosts(prev => ({ ...prev, ...data.liked }));
      setLikesCount(prev => ({ ...prev, ...data.counts }));
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const toggleLike = async (postId: string, postSlug: string) => {
    if (!user) return;
    
    // Предотвращаем множественные клики
    if (pendingLikes.has(postId)) return;
    setPendingLikes(prev => new Set(prev).add(postId));
    
    // Оптимистичное обновление
    const wasLiked = likedPosts[postId];
    setLikedPosts(prev => ({ ...prev, [postId]: !wasLiked }));
    setLikesCount(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (wasLiked ? -1 : 1)
    }));
    
    try {
      const res = await fetch(`/api/posts/${postSlug}/like`, { method: 'POST' });
      const data = await res.json();
      
      setLikedPosts(prev => ({ ...prev, [postId]: data.liked }));
      setLikesCount(prev => ({ ...prev, [postId]: data.likesCount }));
    } catch (error) {
      // Откат при ошибке
      setLikedPosts(prev => ({ ...prev, [postId]: wasLiked }));
      setLikesCount(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + (wasLiked ? 1 : -1)
      }));
    } finally {
      setPendingLikes(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  return (
    <LikesContext.Provider value={{ likedPosts, likesCount, toggleLike, fetchLikesForPosts }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within LikesProvider');
  }
  return context;
}