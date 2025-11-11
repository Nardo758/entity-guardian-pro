import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAsyncDataOptions<T> {
  fetchFunction: () => Promise<T>;
  dependencies?: any[];
  initialData?: T;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
  enabled?: boolean;
}

interface UseAsyncDataReturn<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
  isRetrying: boolean;
}

/**
 * Enhanced hook for async data fetching with loading states, error handling, and retry logic
 */
export const useAsyncData = <T>({
  fetchFunction,
  dependencies = [],
  initialData,
  onError,
  retryAttempts = 3,
  retryDelay = 1000,
  enabled = true,
}: UseAsyncDataOptions<T>): UseAsyncDataReturn<T> => {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const retryCount = useRef<number>(0);
  const abortController = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Cancel any pending requests
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await fetchFunction();
      setData(result);
      retryCount.current = 0; // Reset retry count on success
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      
      // Don't set error if the request was aborted
      if (error.name === 'AbortError') {
        return;
      }

      setError(error);
      
      // Auto-retry logic
      if (retryCount.current < retryAttempts) {
        retryCount.current += 1;
        const delay = retryDelay * Math.pow(2, retryCount.current - 1); // Exponential backoff
        
        setTimeout(() => {
          fetchData(true);
        }, delay);
      } else {
        // Max retries reached, call error callback
        if (onError) {
          onError(error);
        }
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [fetchFunction, enabled, retryAttempts, retryDelay, onError]);

  const refetch = useCallback(async () => {
    retryCount.current = 0;
    await fetchData();
  }, [fetchData]);

  const retry = useCallback(async () => {
    retryCount.current = 0;
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    fetchData();

    // Cleanup function
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    retry,
    isRetrying,
  };
};

export default useAsyncData;
