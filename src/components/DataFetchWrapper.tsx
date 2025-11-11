import { ReactNode } from 'react';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

interface DataFetchWrapperProps {
  loading: boolean;
  error: Error | null;
  data?: unknown;
  children: ReactNode;
  loadingMessage?: string;
  errorTitle?: string;
  onRetry?: () => void;
  emptyMessage?: string;
  fullScreen?: boolean;
}

/**
 * Wrapper component for handling loading, error, and empty states
 * for data fetching operations. Simplifies component logic by 
 * centralizing state handling.
 * 
 * @example
 * const { entities, loading, error, refetch } = useEntities();
 * 
 * <DataFetchWrapper 
 *   loading={loading} 
 *   error={error} 
 *   data={entities}
 *   onRetry={refetch}
 *   emptyMessage="No entities found"
 * >
 *   <EntityList entities={entities} />
 * </DataFetchWrapper>
 */
export const DataFetchWrapper = ({
  loading,
  error,
  data,
  children,
  loadingMessage,
  errorTitle,
  onRetry,
  emptyMessage,
  fullScreen = false
}: DataFetchWrapperProps) => {
  if (loading) {
    return <LoadingState message={loadingMessage} fullScreen={fullScreen} />;
  }

  if (error) {
    return (
      <ErrorState 
        error={error} 
        title={errorTitle}
        onRetry={onRetry}
        fullScreen={fullScreen}
      />
    );
  }

  // Check for empty data (arrays or objects)
  if (data !== undefined) {
    const isEmpty = Array.isArray(data) 
      ? data.length === 0 
      : Object.keys(data as object).length === 0;

    if (isEmpty && emptyMessage) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};
