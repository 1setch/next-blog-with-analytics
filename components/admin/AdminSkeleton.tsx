export default function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 animate-pulse">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
        </div>

        {/* Карточки статистики */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* График лайков */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Два графика */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>

        {/* Таблица топов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}