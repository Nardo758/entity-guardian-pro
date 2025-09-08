import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  is_active: boolean;
  last_used?: string;
  usage_count: number;
  created_at: string;
  expires_at?: string;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: string;
  description: string;
  auth_required: boolean;
  rate_limit: number;
  usage_24h: number;
  avg_response_time: number;
  error_rate: number;
  is_active: boolean;
}

export interface APIUsageStats {
  total_requests_24h: number;
  total_requests_7d: number;
  total_requests_30d: number;
  unique_clients: number;
  avg_response_time: number;
  error_rate: number;
  top_endpoints: Array<{
    path: string;
    requests: number;
    error_rate: number;
  }>;
  usage_by_hour: Array<{
    hour: string;
    requests: number;
  }>;
}

export const useAPIManagement = () => {
  const { isAdmin } = useAdminAccess();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [usageStats, setUsageStats] = useState<APIUsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAPIData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch real API usage logs
      const { data: apiLogs } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      // Mock API keys - in a real app, these would come from a secure table
      const mockApiKeys: APIKey[] = [
        {
          id: '1',
          name: 'Main Integration API',
          key_prefix: 'sk_live_abc123...',
          permissions: ['read:entities', 'write:entities', 'read:users'],
          rate_limit: 1000,
          is_active: true,
          last_used: '2024-01-08T14:30:00Z',
          usage_count: 15420,
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Analytics Dashboard',
          key_prefix: 'sk_test_def456...',
          permissions: ['read:analytics', 'read:reports'],
          rate_limit: 500,
          is_active: true,
          last_used: '2024-01-08T12:15:00Z',
          usage_count: 8970,
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          id: '3',
          name: 'Mobile App',
          key_prefix: 'sk_live_ghi789...',
          permissions: ['read:entities', 'read:users', 'write:documents'],
          rate_limit: 2000,
          is_active: false,
          last_used: '2024-01-05T09:22:00Z',
          usage_count: 3250,
          created_at: '2024-01-10T00:00:00Z',
          expires_at: '2024-12-31T23:59:59Z',
        },
      ];

      // Mock API endpoints
      const mockEndpoints: APIEndpoint[] = [
        {
          id: '1',
          path: '/api/v1/entities',
          method: 'GET',
          description: 'List and search entities',
          auth_required: true,
          rate_limit: 100,
          usage_24h: 1250,
          avg_response_time: 145,
          error_rate: 0.8,
          is_active: true,
        },
        {
          id: '2',
          path: '/api/v1/entities',
          method: 'POST',
          description: 'Create new entity',
          auth_required: true,
          rate_limit: 50,
          usage_24h: 89,
          avg_response_time: 220,
          error_rate: 2.1,
          is_active: true,
        },
        {
          id: '3',
          path: '/api/v1/users',
          method: 'GET',
          description: 'Get user information',
          auth_required: true,
          rate_limit: 200,
          usage_24h: 890,
          avg_response_time: 98,
          error_rate: 0.3,
          is_active: true,
        },
        {
          id: '4',
          path: '/api/v1/analytics',
          method: 'GET',
          description: 'Get analytics data',
          auth_required: true,
          rate_limit: 25,
          usage_24h: 156,
          avg_response_time: 520,
          error_rate: 1.2,
          is_active: true,
        },
        {
          id: '5',
          path: '/api/v1/documents',
          method: 'POST',
          description: 'Upload documents',
          auth_required: true,
          rate_limit: 30,
          usage_24h: 67,
          avg_response_time: 1850,
          error_rate: 0.9,
          is_active: true,
        },
      ];

      // Generate usage statistics
      const mockUsageStats: APIUsageStats = {
        total_requests_24h: mockEndpoints.reduce((sum, ep) => sum + ep.usage_24h, 0),
        total_requests_7d: mockEndpoints.reduce((sum, ep) => sum + ep.usage_24h, 0) * 7,
        total_requests_30d: mockEndpoints.reduce((sum, ep) => sum + ep.usage_24h, 0) * 30,
        unique_clients: 47,
        avg_response_time: 285,
        error_rate: 1.1,
        top_endpoints: mockEndpoints
          .sort((a, b) => b.usage_24h - a.usage_24h)
          .slice(0, 5)
          .map(ep => ({
            path: `${ep.method} ${ep.path}`,
            requests: ep.usage_24h,
            error_rate: ep.error_rate,
          })),
        usage_by_hour: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          requests: Math.floor(Math.random() * 200) + 50,
        })),
      };

      setApiKeys(mockApiKeys);
      setEndpoints(mockEndpoints);
      setUsageStats(mockUsageStats);
    } catch (err) {
      console.error('Error fetching API data:', err);
      setError('Failed to fetch API management data');
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async (name: string, permissions: string[], rateLimit: number, expiresAt?: string) => {
    try {
      const newApiKey: APIKey = {
        id: `key_${Date.now()}`,
        name,
        key_prefix: `sk_live_${Math.random().toString(36).substring(2, 15)}...`,
        permissions,
        rate_limit: rateLimit,
        is_active: true,
        usage_count: 0,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
      };

      setApiKeys(prev => [newApiKey, ...prev]);
      return newApiKey;
    } catch (err) {
      console.error('Error creating API key:', err);
      throw new Error('Failed to create API key');
    }
  };

  const revokeAPIKey = async (keyId: string) => {
    try {
      setApiKeys(prev =>
        prev.map(key =>
          key.id === keyId ? { ...key, is_active: false } : key
        )
      );
    } catch (err) {
      console.error('Error revoking API key:', err);
      throw new Error('Failed to revoke API key');
    }
  };

  const updateEndpoint = async (endpointId: string, updates: Partial<APIEndpoint>) => {
    try {
      setEndpoints(prev =>
        prev.map(endpoint =>
          endpoint.id === endpointId ? { ...endpoint, ...updates } : endpoint
        )
      );
    } catch (err) {
      console.error('Error updating endpoint:', err);
      throw new Error('Failed to update endpoint');
    }
  };

  const regenerateAPIKey = async (keyId: string) => {
    try {
      setApiKeys(prev =>
        prev.map(key =>
          key.id === keyId
            ? {
                ...key,
                key_prefix: `sk_live_${Math.random().toString(36).substring(2, 15)}...`,
              }
            : key
        )
      );
    } catch (err) {
      console.error('Error regenerating API key:', err);
      throw new Error('Failed to regenerate API key');
    }
  };

  useEffect(() => {
    fetchAPIData();
  }, [isAdmin]);

  return {
    apiKeys,
    endpoints,
    usageStats,
    loading,
    error,
    createAPIKey,
    revokeAPIKey,
    updateEndpoint,
    regenerateAPIKey,
    refetch: fetchAPIData,
  };
};