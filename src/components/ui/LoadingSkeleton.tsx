import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'plan' | 'checkout' | 'inline' | 'overlay';
  message?: string;
  className?: string;
}

export function LoadingSkeleton({ 
  variant = 'inline', 
  message,
  className 
}: LoadingSkeletonProps) {
  if (variant === 'overlay') {
    return (
      <div className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
        className
      )}>
        <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-4 max-w-sm mx-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {message && (
            <p className="text-sm text-muted-foreground text-center">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'plan') {
    return (
      <div className={cn("animate-pulse space-y-4", className)}>
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (variant === 'checkout') {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="flex gap-2">
            <div className="h-12 bg-muted rounded flex-1" />
            <div className="h-12 bg-muted rounded flex-1" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {message || 'Loading payment form...'}
        </div>
      </div>
    );
  }

  // inline variant
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {message && <span>{message}</span>}
    </div>
  );
}
