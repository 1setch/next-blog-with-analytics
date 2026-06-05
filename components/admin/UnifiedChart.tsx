'use client';

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieLabelRenderProps
} from 'recharts';
import { useState, useEffect } from 'react';

type ChartType = 'line' | 'bar' | 'area' | 'pie';

interface DataItem {
  [key: string]: any;
  name?: string;
  hour?: string;
  _id?: string;
  count?: number;
  value?: number;
}

interface UnifiedChartProps {
  type: ChartType;
  data: DataItem[];
  title: string;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  xAxisKey?: string;
  height?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4', '#84cc16'];

export default function UnifiedChart({ 
  type, 
  data, 
  title, 
  dataKey = 'value',
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  xAxisKey = 'name',
  height = 300
}: UnifiedChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">Нет данных</p>
      </div>
    );
  }

  // Получаем ключ для оси X
  const getXAxisKey = () => {
    if (xAxisKey === 'name' && data[0]?.name !== undefined) return 'name';
    if (xAxisKey === 'hour' && data[0]?.hour !== undefined) return 'hour';
    if (data[0]?._id !== undefined) return '_id';
    return xAxisKey;
  };

  const renderChart = () => {
    const chartHeight = isMobile ? height - 50 : height;
    const xKey = getXAxisKey();
    
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey={xKey} 
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 1 : 0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey={xKey}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 1 : 0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey={xKey}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              interval={isMobile ? 1 : 0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              fill="url(#areaGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        );
      
      case 'pie':
        // Для мобильных устройств упрощаем отображение
        let pieData = [...data];
        if (isMobile && data.length > 5) {
          const topData = data.slice(0, 4);
          const otherCount = data.slice(4).reduce((sum, item) => sum + (item[dataKey] || 0), 0);
          pieData = [...topData, { [nameKey]: 'Остальные', [dataKey]: otherCount }];
        }
        
        // Функция для рендера метки на pie
        const renderLabel = (entry: any) => {
          if (isMobile) return '';
          const name = entry[nameKey] || '';
          const value = entry[dataKey] || 0;
          return `${name}: ${value}`;
        };
        
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any, name: any) => [value, name]}
            />
            <Legend 
              wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
              layout={isMobile ? 'horizontal' : 'vertical'}
              verticalAlign={isMobile ? 'bottom' : 'middle'}
              align={isMobile ? 'center' : 'right'}
            />
          </PieChart>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}