export default function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 animate-pulse">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-3"></div>
            <div className="h-16 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-32 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
}