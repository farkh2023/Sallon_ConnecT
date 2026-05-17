'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SnapshotTimelineItem } from '@/lib/types';

interface ScoreRadarChartProps {
  item: SnapshotTimelineItem;
}

export function ScoreRadarChart({ item }: ScoreRadarChartProps) {
  const data = [
    { subject: 'Sécurité', score: item.securityScore },
    { subject: 'Intégrations', score: item.integrationScore },
    { subject: 'Scheduler', score: item.schedulerScore },
    { subject: 'Runtime', score: item.runtimeScore },
    { subject: 'Notifications', score: item.notificationScore },
    { subject: 'Mémoire', score: item.memoryScore },
  ];

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
            formatter={(value: unknown) => [Number(value).toFixed(2), 'Score']}
          />
          <Radar
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
