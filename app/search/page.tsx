'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PostCard from '@/components/PostCard';
import PostCardSkeleton from '@/components/Skeleton/PostCardSkeleton';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [popularTags, setPopularTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    tag: '',
    from: '',
    to: '',
    sortBy: 'relevance',
  });
  
  const performSearch = useCallback(async () => {
    if (!query.trim() && !filters.tag) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setResults(data.posts || []);
      setPopularTags(data.popularTags || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);
  
  useEffect(() => {
    if (initialQuery) {
      performSearch();
    }
    fetchPopularTags();
  }, []);
  
  const fetchPopularTags = async () => {
    try {
      const res = await fetch('/api/search?limit=0');
      const data = await res.json();
      setPopularTags(data.popularTags || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    performSearch();
  };
  
  const handleTagClick = (tag: string) => {
    setFilters(prev => ({ ...prev, tag: prev.tag === tag ? '' : tag }));
    setTimeout(() => performSearch(), 100);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">🔍 Поиск</h1>
      
      {/* Форма поиска */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск постов..."
            className="flex-1 border rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Найти
          </button>
        </div>
      </form>
      
      {/* Фильтры */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Фильтры</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="relevance">По релевантности</option>
            <option value="date">По дате</option>
            <option value="views">По просмотрам</option>
            <option value="likes">По лайкам</option>
          </select>
          
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            placeholder="С даты"
          />
          
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
            className="border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
            placeholder="По дату"
          />
          
          <button
            onClick={() => {
              setFilters({ tag: '', from: '', to: '', sortBy: 'relevance' });
              setTimeout(() => performSearch(), 100);
            }}
            className="text-gray-600 hover:text-red-600 dark:text-gray-400"
          >
            Сбросить фильтры
          </button>
        </div>
        
        {/* Популярные теги */}
        {popularTags.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Популярные теги:</h4>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => handleTagClick(tag.name)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    filters.tag === tag.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                  }`}
                >
                  #{tag.name} ({tag.count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Результаты */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <p className="text-gray-500 mb-4">Найдено: {results.length}</p>
          <div className="space-y-6">
            {results.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        </>
      ) : (query || filters.tag) && (
        <div className="text-center py-12">
          <p className="text-gray-500">Ничего не найдено</p>
          <p className="text-sm text-gray-400 mt-2">Попробуйте изменить поисковый запрос</p>
        </div>
      )}
      
      {/* Рекомендации */}
      {!query && !filters.tag && popularTags.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Введите поисковый запрос или выберите тег</p>
        </div>
      )}
    </div>
  );
}