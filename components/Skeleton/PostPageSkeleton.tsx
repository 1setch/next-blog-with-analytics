export default function PostPageSkeleton() {
  return (
    <article className="max-w-4xl mx-auto p-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-32 mb-6"></div>
      <div className="h-12 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="flex gap-4 mb-6">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      </div>
    </article>
  );
}