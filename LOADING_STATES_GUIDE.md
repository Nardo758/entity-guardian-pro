# Loading States Implementation Guide

## Overview

This document describes the standardized loading and error state implementation across all data-fetching hooks in Entity Guardian Pro.

## What Was Implemented

### 1. **Hook State Types** (`src/types/hooks.ts`)
Standardized TypeScript types for consistent state management:
- `AsyncState` - Basic loading/error state
- `QueryResult<T>` - Complete data fetch result with refetch
- `MutationState` - Mutation operation state

### 2. **Updated Hooks**

All major data-fetching hooks now return consistent state:

```typescript
const { data, loading, error, refetch } = useHook();
```

#### Updated Hooks List:
- ✅ `useEntities` - Entity management
- ✅ `useAgents` - Agent management  
- ✅ `useDocuments` - Document management
- ✅ `useNotifications` - Notification system
- ✅ `useTeams` - Team collaboration
- ✅ `useSubscription` - Subscription management
- ✅ `usePayments` - Payment tracking
- ✅ `useAnalytics` - Analytics data
- ✅ `useAgentInvitations` - Agent invitation workflow

### 3. **Reusable UI Components**

#### `<LoadingState />` - Loading indicator
```tsx
<LoadingState 
  message="Loading your data..." 
  size="md"
  fullScreen={false}
/>
```

**Props:**
- `message?: string` - Custom loading message
- `size?: 'sm' | 'md' | 'lg'` - Spinner size
- `fullScreen?: boolean` - Cover entire viewport

#### `<ErrorState />` - Error display with retry
```tsx
<ErrorState 
  error={error}
  title="Failed to load data"
  onRetry={refetch}
  retryLabel="Try again"
  fullScreen={false}
/>
```

**Props:**
- `error: Error | null` - Error object to display
- `title?: string` - Error title
- `onRetry?: () => void` - Retry callback function
- `retryLabel?: string` - Retry button text
- `fullScreen?: boolean` - Cover entire viewport

#### `<DataFetchWrapper />` - All-in-one wrapper
Combines loading, error, and empty states in one component.

```tsx
<DataFetchWrapper 
  loading={loading} 
  error={error} 
  data={entities}
  onRetry={refetch}
  loadingMessage="Loading entities..."
  errorTitle="Failed to load entities"
  emptyMessage="No entities found"
>
  <YourComponent data={entities} />
</DataFetchWrapper>
```

**Props:**
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `data?: unknown` - Data to check for empty state
- `children: ReactNode` - Content to render when loaded
- `loadingMessage?: string` - Custom loading message
- `errorTitle?: string` - Custom error title
- `onRetry?: () => void` - Retry function
- `emptyMessage?: string` - Message for empty data
- `fullScreen?: boolean` - Cover entire viewport

## Usage Examples

### Example 1: Simple Data Fetching with Wrapper

```tsx
import { useEntities } from '@/hooks/useEntities';
import { DataFetchWrapper } from '@/components/DataFetchWrapper';
import { EntityList } from '@/components/EntityList';

const EntitiesPage = () => {
  const { entities, loading, error, refetch, deleteEntity } = useEntities();

  return (
    <DataFetchWrapper 
      loading={loading} 
      error={error} 
      data={entities}
      onRetry={refetch}
      emptyMessage="No entities found. Add your first entity to get started."
    >
      <EntityList entities={entities} onDelete={deleteEntity} />
    </DataFetchWrapper>
  );
};
```

### Example 2: Manual Loading/Error Handling

```tsx
import { useNotifications } from '@/hooks/useNotifications';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';

const NotificationsPanel = () => {
  const { notifications, loading, error, refetch } = useNotifications();

  if (loading) {
    return <LoadingState message="Loading notifications..." />;
  }

  if (error) {
    return (
      <ErrorState 
        error={error} 
        title="Failed to load notifications"
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      {notifications.map(notif => (
        <NotificationCard key={notif.id} notification={notif} />
      ))}
    </div>
  );
};
```

### Example 3: Conditional Rendering

```tsx
import { useTeams } from '@/hooks/useTeams';

const TeamSelector = () => {
  const { teams, loading, error, refetch } = useTeams();

  if (loading) return <div>Loading teams...</div>;
  
  if (error) {
    return (
      <div className="text-red-500">
        {error.message}
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (teams.length === 0) {
    return <div>No teams available</div>;
  }

  return (
    <select>
      {teams.map(team => (
        <option key={team.id} value={team.id}>
          {team.name}
        </option>
      ))}
    </select>
  );
};
```

### Example 4: Multiple Data Sources

```tsx
import { useEntities } from '@/hooks/useEntities';
import { useDocuments } from '@/hooks/useDocuments';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';

const Dashboard = () => {
  const { 
    entities, 
    loading: entitiesLoading, 
    error: entitiesError,
    refetch: refetchEntities 
  } = useEntities();
  
  const { 
    documents, 
    loading: docsLoading, 
    error: docsError,
    refetch: refetchDocs 
  } = useDocuments();

  const isLoading = entitiesLoading || docsLoading;
  const error = entitiesError || docsError;
  
  if (isLoading) {
    return <LoadingState message="Loading dashboard..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorState 
        error={error}
        onRetry={() => {
          refetchEntities();
          refetchDocs();
        }}
      />
    );
  }

  return (
    <div>
      <EntitySummary entities={entities} />
      <DocumentSummary documents={documents} />
    </div>
  );
};
```

## Best Practices

### 1. **Always Handle All States**
```tsx
// ✅ Good
const { data, loading, error, refetch } = useHook();

// ❌ Avoid
const { data } = useHook(); // Missing loading/error handling
```

### 2. **Provide Helpful Error Messages**
```tsx
// ✅ Good
<DataFetchWrapper 
  error={error}
  errorTitle="Failed to load your entities"
  onRetry={refetch}
/>

// ❌ Avoid
{error && <div>Error!</div>}
```

### 3. **Use Loading Indicators for Better UX**
```tsx
// ✅ Good - Shows immediate feedback
{loading && <LoadingState message="Loading..." />}

// ❌ Avoid - User sees blank screen
{!loading && <Content />}
```

### 4. **Implement Retry Functionality**
Always provide a way for users to retry failed operations:
```tsx
<ErrorState error={error} onRetry={refetch} />
```

### 5. **Handle Empty States**
```tsx
<DataFetchWrapper 
  data={items}
  emptyMessage="No items yet. Add your first item to get started."
>
  {/* content */}
</DataFetchWrapper>
```

## Error Handling Pattern

All hooks follow this standardized error handling pattern:

```typescript
const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await supabase
      .from('table')
      .select('*');

    if (fetchError) throw fetchError;
    setData(data);
  } catch (err) {
    const error = err instanceof Error 
      ? err 
      : new Error('Failed to load data');
    setError(error);
    console.error('Error:', err);
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

## Testing Loading States

### Manual Testing Checklist
- [ ] Initial page load shows loading indicator
- [ ] Error state displays properly with error message
- [ ] Retry button successfully refetches data
- [ ] Empty state shows when no data available
- [ ] Loading indicator disappears when data loads
- [ ] Multiple rapid refetches don't cause issues
- [ ] Network errors display user-friendly messages

### Simulating States in Development

```tsx
// Simulate loading
const [loading, setLoading] = useState(true);
useEffect(() => {
  setTimeout(() => setLoading(false), 2000);
}, []);

// Simulate error
const [error] = useState(new Error('Test error message'));

// Simulate empty state
const [data] = useState([]);
```

## Migration Guide

### Updating Existing Components

**Before:**
```tsx
const MyComponent = () => {
  const { entities, loading } = useEntities();
  
  if (loading) return <div>Loading...</div>;
  
  return <EntityList entities={entities} />;
};
```

**After:**
```tsx
const MyComponent = () => {
  const { entities, loading, error, refetch } = useEntities();
  
  return (
    <DataFetchWrapper 
      loading={loading} 
      error={error} 
      data={entities}
      onRetry={refetch}
      emptyMessage="No entities found"
    >
      <EntityList entities={entities} />
    </DataFetchWrapper>
  );
};
```

## Impact

### Benefits
✅ **Consistent UX** - All data loading behaves the same way  
✅ **Better Error Handling** - Users see helpful error messages  
✅ **Retry Functionality** - Users can recover from errors  
✅ **Type Safety** - TypeScript ensures correct usage  
✅ **Reduced Boilerplate** - Reusable components save code  
✅ **Improved Accessibility** - Loading states announced to screen readers  

### Metrics
- **9 hooks updated** with consistent error states
- **3 reusable components** created
- **1 comprehensive wrapper** component
- **Type definitions** for standardized patterns

## Next Steps

1. ✅ Create loading state components
2. ✅ Update all data-fetching hooks
3. ⏳ Update all components using hooks (in progress)
4. ⏳ Add loading state tests
5. ⏳ Document performance improvements

## Support

For questions or issues with loading states:
1. Check this guide first
2. Review component examples in `src/components/`
3. Check hook implementations in `src/hooks/`
