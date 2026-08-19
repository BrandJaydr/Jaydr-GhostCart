'use client';

import { Activity } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@heroui/react';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ActivityFeedProps {
  title?: string;
  description?: string;
  items: ActivityItem[];
  emptyMessage?: string;
}

export function ActivityFeed({
  title = 'Recent Activity',
  description,
  items,
  emptyMessage = 'No recent activity',
}: ActivityFeedProps) {
  const getTypeStyles = (type: ActivityItem['type']) => {
    switch (type) {
      case 'error':
        return 'text-danger-600 border-danger-200 bg-danger-50';
      case 'success':
        return 'text-success-600 border-success-200 bg-success-50';
      case 'warning':
        return 'text-warning-600 border-warning-200 bg-warning-50';
      case 'info':
      default:
        return 'text-primary-600 border-primary-200 bg-primary-50';
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col items-start px-6 pb-0 pt-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardBody className="max-h-[400px] overflow-y-auto px-6 py-4">
        {items && items.length > 0 ? (
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const styles = getTypeStyles(item.type);
              const [textColor, borderColor, bgColor] = styles.split(' ');
              return (
                <div key={item.id} className={`flex flex-col rounded-md border p-3 ${borderColor} ${bgColor}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${textColor}`}>{item.title}</span>
                    <span className="text-xs font-medium text-muted-foreground">{item.timestamp}</span>
                  </div>
                  <span className="mt-1 text-xs text-muted-foreground">{item.description}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <Activity className="mb-2 h-8 w-8 text-neutral-300" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
