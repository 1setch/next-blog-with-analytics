'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface LikesChartProps {
  likesByDay: any[];  // ← принимаем likesByDay напрямую, а не stats
}

export default function LikesChart({ likesByDay }: LikesChartProps) {
  const data = likesByDay?.map(day => ({
    date: day._id,
    likes: day.count
  })) || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📈 Динамика лайков по дням
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="likes"
            stroke="#ef4444"
            fill="url(#likesGradient)"
            name="Лайки"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}