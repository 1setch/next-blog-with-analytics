'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { useState } from 'react';

interface ActivityChartProps {
  activityData: any[];
}

export default function ActivityChart({ activityData }: ActivityChartProps) {
  const [chartType, setChartType] = useState<'combined' | 'separate'>('combined');

  if (!activityData || activityData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">⏰ Активность пользователей</h3>
        <p className="text-gray-500 text-center py-8">Нет данных для отображения</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          ⏰ Активность пользователей
        </h3>
        
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('combined')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              chartType === 'combined'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Комбинированный
          </button>
          <button
            onClick={() => setChartType('separate')}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              chartType === 'separate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Раздельные
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Активность в течение дня: посты и лайки
      </p>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'combined' ? (
          <ComposedChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              angle={-45}
              textAnchor="end"
              height={60}
              interval={2}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="posts" 
              fill="#3b82f6" 
              name="📝 Посты"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="likes" 
              stroke="#ef4444" 
              name="❤️ Лайки"
              strokeWidth={2}
            />
          </ComposedChart>
        ) : (
          <>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                angle={-45}
                textAnchor="end"
                height={60}
                interval={2}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="posts" 
                fill="#3b82f6" 
                name="📝 Посты"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="likes" 
                fill="#ef4444" 
                name="❤️ Лайки"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </>
        )}
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Пик постов</div>
          <div className="font-semibold text-blue-600 dark:text-blue-400">
            {activityData.reduce((max, item) => 
              item.posts > max.posts ? item : max, activityData[0]
            ).hour}
          </div>
        </div>
        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Пик лайков</div>
          <div className="font-semibold text-red-600 dark:text-red-400">
            {activityData.reduce((max, item) => 
              item.likes > max.likes ? item : max, activityData[0]
            ).hour}
          </div>
        </div>
        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Самое активное время</div>
          <div className="font-semibold text-green-600 dark:text-green-400">
            {activityData.reduce((max, item) => 
              item.total > max.total ? item : max, activityData[0]
            ).hour}
          </div>
        </div>
        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Всего за сегодня</div>
          <div className="font-semibold text-purple-600 dark:text-purple-400">
            {(() => {
              const currentHour = new Date().getHours();
              const currentData = activityData.find(d => parseInt(d.hour) === currentHour);
              return (currentData?.posts || 0) + (currentData?.likes || 0);
            })()}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        * Активность рассчитывается по времени создания постов и лайков
      </p>
    </div>
  );
}