'use client';

import { Card, CardHeader, CardBody } from '@heroui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ChartDataPoint {
  name: string;
  value: number;
}

interface MetricChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}

export function MetricChart({
  title,
  description,
  data,
  color = '#3b82f6', // default primary
  height = 300,
}: MetricChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col items-start px-6 pb-0 pt-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardBody className="px-6 py-4">
        {data && data.length > 0 ? (
          <div style={{ height: `${height}px`, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--nextui-default-200))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--nextui-default-500))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--nextui-default-500))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color} 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </CardBody>
    </Card>
  );
}
