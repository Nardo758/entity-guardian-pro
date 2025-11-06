# Loading States Implementation Guide

## Overview
This guide explains the comprehensive loading state system implemented across Entity Guardian Pro for better user experience during data fetching operations.

## Components

### 1. LoadingState Component
Displays a spinner with an optional message.

```tsx
import { LoadingState, InlineLoadingState } from '@/components/LoadingState';

// Full-screen loading
<LoadingState fullScreen message="Loading your data..." />

// Standard loading
<LoadingState size="md" message="Fetching entities..." />

// Inline loading (for smaller areas)
<InlineLoadingState message="Updating..." />
```

**Props:**
- `message?: string` - Loading message (default: "Loading...")
- `size?: 'sm' | 'md' | 'lg'` - Spinner size (default: 'md')
- `fullScreen?: boolean` - Full-screen display (default: false)

---

### 2. ErrorState Component
Displays error messages with optional retry functionality.

```tsx
import { ErrorState, InlineErrorState } from '@/components/ErrorState';

// Full error display with retry
<ErrorState 
  error={error} 
  onRetry={refetch} 
  title="Failed to load data"
/>

// Inline error (for smaller areas)
<InlineErrorState error={error} onRetry={refetch} />
```

**Props:**
- `error: Error | null` - Error object to display
- `onRetry?: () => void` - Callback for retry button
- `fullScreen?: boolean` - Full-screen display (default: false)
- `title?: string` - Error title (default: "Something went wrong")

---

### 3. EmptyState Component
Displays a friendly message when no data is available.

```tsx
import EmptyState from '@/components/EmptyState';

<EmptyState
  icon={<Inbox className="w-12 h-12" />}
  title="No entities found"
  description="Get started by creating your first entity"
  actionLabel="Add Entity"
  onAction={handleAddEntity}
/>
```

**Props:**
- `icon?: ReactNode` - Custom icon (default: Inbox)
- `title: string` - Main heading (required)
- `description?: string` - Supporting text
- `actionLabel?: string` - Button text
- `onAction?: () => void` - Button click handler
- `fullScreen?: boolean` - Full-screen display (default: false)

---

### 4. Skeleton Loaders
Animated placeholder components for better perceived performance.

```tsx
import { 
  CardSkeleton, 
  TableSkeleton, 
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton 
} from '@/components/SkeletonLoaders';

// Card loading
if (loading) return <CardSkeleton />;

// List loading
if (loading) return <ListSkeleton items={5} />;

// Table loading
if (loading) return <TableSkeleton rows={10} />;

// Form loading
if (loading) return <FormSkeleton />;

// Dashboard loading
if (loading) return <DashboardSkeleton />;
```

---

## Hooks

### useAsyncData Hook
Enhanced data fetching with built-in loading states, error handling, and retry logic.

```tsx
import { useAsyncData } from '@/hooks/useAsyncData';

const MyComponent = () => {
  const { data, loading, error, refetch, retry, isRetrying } = useAsyncData({
    fetchFunction: async () => {
      const response = await fetch('/api/data');
      return response.json();
    },
    dependencies: [userId],
    retryAttempts: 3,
    retryDelay: 1000,
    onError: (error) => console.error('Failed:', error),
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={retry} />;
  if (!data) return <EmptyState title="No data" />;

  return <div>{/* Render data */}</div>;
};
```

**Options:**
- `fetchFunction: () => Promise<T>` - Async function to fetch data (required)
- `dependencies?: any[]` - Re-fetch when dependencies change
- `initialData?: T` - Initial data value
- `onError?: (error: Error) => void` - Error callback
- `retryAttempts?: number` - Max retry attempts (default: 3)
- `retryDelay?: number` - Initial retry delay in ms (default: 1000)
- `enabled?: boolean` - Enable/disable fetching (default: true)

**Returns:**
- `data: T | undefined` - Fetched data
- `loading: boolean` - Initial loading state
- `error: Error | null` - Error object if failed
- `refetch: () => Promise<void>` - Manually refetch data
- `retry: () => Promise<void>` - Retry failed request
- `isRetrying: boolean` - Retry in progress

---

## Usage Patterns

### Pattern 1: Basic Data Fetching
```tsx
const MyComponent = () => {
  const { entities, loading, error } = useEntities();

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (entities.length === 0) return <EmptyState title="No entities" />;

  return (
    <div>
      {entities.map(entity => (
        <EntityCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
};
```

### Pattern 2: With Retry Logic
```tsx
const MyComponent = () => {
  const { documents, loading, error, refetch } = useDocuments();

  if (loading) return <ListSkeleton items={3} />;
  
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (documents.length === 0) {
    return <EmptyState title="No documents" />;
  }

  return <DocumentList documents={documents} />;
};
```

### Pattern 3: Inline Loading States
```tsx
const MyComponent = () => {
  const { data, loading, error } = useData();
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    await updateData();
    setUpdating(false);
  };

  return (
    <div>
      {loading ? <InlineLoadingState /> : <DataView data={data} />}
      
      {error && <InlineErrorState error={error} />}
      
      <Button onClick={handleUpdate} disabled={updating}>
        {updating && <InlineLoadingState message="Saving..." />}
        {!updating && 'Save Changes'}
      </Button>
    </div>
  );
};
```

### Pattern 4: Multiple Loading States
```tsx
const DashboardComponent = () => {
  const { entities, loading: entitiesLoading } = useEntities();
  const { documents, loading: docsLoading } = useDocuments();
  const { notifications, loading: notifLoading } = useNotifications();

  const isLoading = entitiesLoading || docsLoading || notifLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <EntitiesPanel entities={entities} />
      <DocumentsPanel documents={documents} />
      <NotificationsPanel notifications={notifications} />
    </div>
  );
};
```

### Pattern 5: Conditional Data Fetching
```tsx
const ConditionalFetch = () => {
  const [entityId, setEntityId] = useState<string | null>(null);

  const { data, loading, error } = useAsyncData({
    fetchFunction: async () => {
      if (!entityId) return null;
      return fetchEntityDetails(entityId);
    },
    dependencies: [entityId],
    enabled: !!entityId, // Only fetch when entityId exists
  });

  return (
    <div>
      <EntitySelector onChange={setEntityId} />
      
      {loading && <LoadingState message="Loading details..." />}
      {error && <ErrorState error={error} />}
      {data && <EntityDetails data={data} />}
    </div>
  );
};
```

---

## Best Practices

### 1. Choose the Right Loading Component
- **Skeleton Loaders**: Best for initial page loads (better perceived performance)
- **LoadingState**: Good for full-page or section loading
- **InlineLoadingState**: Use for small UI updates or button states

### 2. Always Handle All States
```tsx
// ✅ Good - handles all states
if (loading) return <LoadingState />;
if (error) return <ErrorState error={error} onRetry={refetch} />;
if (data.length === 0) return <EmptyState />;
return <DataView data={data} />;

// ❌ Bad - missing error handling
if (loading) return <LoadingState />;
return <DataView data={data} />;
```

### 3. Provide Clear Feedback
```tsx
// ✅ Good - specific messages
<LoadingState message="Loading your entities..." />
<ErrorState error={error} title="Failed to load entities" />

// ❌ Bad - generic messages
<LoadingState message="Loading..." />
<ErrorState error={error} />
```

### 4. Implement Retry Logic
```tsx
// ✅ Good - allows user to retry
<ErrorState error={error} onRetry={refetch} />

// ❌ Bad - no way to recover
<ErrorState error={error} />
```

### 5. Use Skeleton Loaders for Better UX
```tsx
// ✅ Good - shows page structure while loading
if (loading) return <CardSkeleton />;

// ⚠️ Acceptable but less optimal
if (loading) return <LoadingState message="Loading..." />;
```

---

## Existing Hooks with Loading States

All data-fetching hooks in the application already implement loading and error states:

- ✅ `useEntities` - Entity management
- ✅ `useDocuments` - Document handling
- ✅ `useAgents` - Agent data
- ✅ `useNotifications` - Notifications
- ✅ `useAnalytics` - Analytics data
- ✅ `useSubscription` - Subscription info
- ✅ `useTeams` - Team management
- ✅ `usePayments` - Payment operations
- ✅ And more...

All these hooks return `{ data, loading, error, refetch }` for consistent usage patterns.

---

## Migration Guide

### Updating Existing Components

**Before:**
```tsx
const MyComponent = () => {
  const { entities } = useEntities();
  
  return (
    <div>
      {entities.map(e => <EntityCard key={e.id} entity={e} />)}
    </div>
  );
};
```

**After:**
```tsx
const MyComponent = () => {
  const { entities, loading, error, refetch } = useEntities();
  
  if (loading) return <ListSkeleton items={3} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (entities.length === 0) {
    return <EmptyState title="No entities" actionLabel="Add Entity" />;
  }
  
  return (
    <div>
      {entities.map(e => <EntityCard key={e.id} entity={e} />)}
    </div>
  );
};
```

---

## Testing Loading States

```tsx
// Simulate loading
const TestComponent = () => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);
  
  if (loading) return <CardSkeleton />;
  return <div>Content loaded!</div>;
};

// Simulate error
const ErrorTestComponent = () => {
  const [error] = useState(new Error('Test error'));
  return <ErrorState error={error} onRetry={() => console.log('Retry')} />;
};
```

---

## Performance Considerations

1. **Use React.memo** for skeleton components to prevent unnecessary re-renders
2. **Implement suspense boundaries** for code-split components
3. **Avoid nested loading states** - show one consolidated loading state
4. **Use optimistic updates** where appropriate to reduce perceived loading time

---

## Resources

- Components: `/src/components/LoadingState.tsx`, `/src/components/ErrorState.tsx`, `/src/components/EmptyState.tsx`
- Skeletons: `/src/components/SkeletonLoaders.tsx`
- Hooks: `/src/hooks/useAsyncData.ts`
- Example: `/src/components/DataFetchExample.tsx`
