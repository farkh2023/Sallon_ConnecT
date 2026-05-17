'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SnapshotTimelineItem } from '@/lib/types';

interface NotificationsTrendChartProps {
  items: SnapshotTimelineItem[];
}

function formatTick(value: string) {
  const d = new Date(value);
  return d.toLocaleString('fr-FR', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function NotificationsTrendChart({ items }: NotificationsTrendChartProps) {
  const data = items.map(item => ({
    createdAt: item.createdAt,
    notificationScore: item.notificationScore,
  }));

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="createdAt"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickFormatter={v => formatTick(String(v))}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.5, 1]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            formatter={(value: unknown) => [Number(value).toFixed(2), 'Score notifications']}
            labelFormatter={v => formatTick(String(v))}
          />
          <Line
            type="monotone"
            dataKey="notificationScore"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
