import React from 'react';
import { LoadingState, InlineLoadingState } from '@/components/LoadingState';
import { ErrorState, InlineErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { CardSkeleton, ListSkeleton } from '@/components/SkeletonLoaders';
import { FileText } from 'lucide-react';

/**
 * Example component demonstrating proper loading state patterns
 * 
 * Usage patterns:
 * 
 * 1. Full-page loading:
 *    if (loading) return <LoadingState fullScreen message="Loading data..." />;
 * 
 * 2. Inline loading:
 *    {loading && <InlineLoadingState message="Updating..." />}
 * 
 * 3. Skeleton loading (best UX):
 *    if (loading) return <CardSkeleton />; // or ListSkeleton, TableSkeleton, etc.
 * 
 * 4. Error handling:
 *    if (error) return <ErrorState error={error} onRetry={refetch} />;
 * 
 * 5. Empty state:
 *    if (!loading && data.length === 0) {
 *      return <EmptyState title="No data" description="Get started by adding items" />;
 *    }
 */

interface DataFetchExampleProps {
  loading: boolean;
  error: Error | null;
  data: any[];
  onRetry: () => void;
  onAdd?: () => void;
}

export const DataFetchExample: React.FC<DataFetchExampleProps> = ({
  loading,
  error,
  data,
  onRetry,
  onAdd,
}) => {
  // Pattern 1: Show skeleton while loading
  if (loading) {
    return <CardSkeleton />;
  }

  // Pattern 2: Show error state with retry
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  // Pattern 3: Show empty state when no data
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="w-12 h-12 text-gray-400" />}
        title="No items found"
        description="Get started by adding your first item"
        actionLabel="Add Item"
        onAction={onAdd}
      />
    );
  }

  // Pattern 4: Render data
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          {/* Your data rendering here */}
          <p>{JSON.stringify(item)}</p>
        </div>
      ))}
    </div>
  );
};

export default DataFetchExample;
