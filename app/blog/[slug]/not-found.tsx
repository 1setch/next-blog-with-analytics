import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto p-4 text-center py-20">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Пост не найден</h2>
      <p className="text-gray-600 mb-8">Такого поста не существует или он был удален</p>
      <Link href="/blog" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
        Вернуться к списку постов
      </Link>
    </div>
  );
}