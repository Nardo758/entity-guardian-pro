/**
 * Standardized hook state types for consistent loading and error handling
 */

export interface AsyncState {
  loading: boolean;
  error: Error | null;
}

export interface MutationState {
  isLoading: boolean;
  error: Error | null;
}

export interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface MutationResult<TData = unknown, TVariables = unknown> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook return type with comprehensive state management
 */
export interface HookState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
