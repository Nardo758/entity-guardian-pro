import React from 'react';
import { Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  fullScreen?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon,
  title,
  description,
  actionLabel,
  onAction,
  fullScreen = false 
}) => {
  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50 px-4'
    : 'flex items-center justify-center p-12';

  const defaultIcon = <Inbox className="w-12 h-12 text-gray-400" />;

  return (
    <div className={containerClasses}>
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center mb-4">
          {icon || defaultIcon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 text-sm mb-6">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
