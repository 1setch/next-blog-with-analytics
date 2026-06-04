'use client';

interface StatsCardsProps {
  stats: {
    total: {
      posts: number;
      users: number;
      views: number;
    };
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: 'Всего постов', value: stats.total.posts, icon: '📝', color: 'bg-blue-500' },
    { title: 'Всего пользователей', value: stats.total.users, icon: '👥', color: 'bg-green-500' },
    { title: 'Всего просмотров', value: stats.total.views, icon: '👁️', color: 'bg-purple-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}