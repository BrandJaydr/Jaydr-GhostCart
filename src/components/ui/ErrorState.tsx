import { Alert } from '@heroui/react';
import { Button as GhostCartButton } from './Button';

export interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  errorCode?: string;
}

export function ErrorState({ title, message, onRetry, errorCode }: ErrorStateProps) {
  return (
    <div className="max-w-md">
      <Alert color="danger" title={title} description={message} />
      <div className="mt-4 flex flex-col gap-2">
        {errorCode && (
          <code className="text-xs bg-red-50 border border-red-200 px-2 py-1 rounded">
            Error: {errorCode}
          </code>
        )}
        {onRetry && (
          <GhostCartButton variant="danger" size="sm" onClick={onRetry}>
            Try Again
          </GhostCartButton>
        )}
      </div>
    </div>
  );
}
