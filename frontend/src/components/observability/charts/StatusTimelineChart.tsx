'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SnapshotTimelineItem } from '@/lib/types';

interface StatusTimelineChartProps {
  items: SnapshotTimelineItem[];
}

function formatTick(value: string) {
  const d = new Date(value);
  return d.toLocaleString('fr-FR', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function StatusTimelineChart({ items }: StatusTimelineChartProps) {
  const data = items.map(item => ({
    createdAt: item.createdAt,
    statusScore: item.statusScore,
    status: item.status,
  }));

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="statusGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            formatter={(value: unknown, _name: unknown, entry: { payload?: { status?: string } }) => {
              return [`${Number(value).toFixed(2)} (${entry?.payload?.status ?? ''})`, 'Score statut'];
            }}
            labelFormatter={v => formatTick(String(v))}
          />
          <Area
            type="monotone"
            dataKey="statusScore"
            stroke="#3b82f6"
            fill="url(#statusGrad)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
