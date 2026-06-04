import { getPosts } from '@/lib/data';
import PostCard from '@/components/PostCard';
import Link from 'next/link';

// ISR - перегенерация каждые 60 секунд
export const revalidate = 60;

export default async function Home() {
  const posts = await getPosts(6);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Последние посты</h1>

      <div className="space-y-6">
        {posts.map((post: any, index: any) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-center text-gray-500">Пока нет постов</p>
      )}

      <div className="text-center mt-8">
        <Link href="/blog" className="text-blue-600 hover:underline">
          Все посты →
        </Link>
      </div>
    </div>
  );
}