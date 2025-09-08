import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'users' | 'entities' | 'compliance' | 'security';
  parameters: Record<string, any>;
  sql_query: string;
  created_at: string;
  is_active: boolean;
}

export interface CustomReport {
  id: string;
  template_id: string;
  name: string;
  parameters: Record<string, any>;
  generated_at: string;
  file_path?: string;
  status: 'pending' | 'completed' | 'failed';
  row_count?: number;
}

export interface ExportJob {
  id: string;
  report_id: string;
  format: 'csv' | 'xlsx' | 'pdf';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  created_at: string;
  completed_at?: string;
}

export const useAdvancedReporting = () => {
  const { isAdmin } = useAdminAccess();
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportingData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Mock data - in a real app, this would come from the database
      const mockTemplates: ReportTemplate[] = [
        {
          id: '1',
          name: 'User Activity Report',
          description: 'Comprehensive user activity and engagement metrics',
          category: 'users',
          parameters: {
            date_range: 'required',
            user_type: 'optional',
            include_inactive: 'boolean'
          },
          sql_query: 'SELECT * FROM user_analytics_view WHERE ...',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
        {
          id: '2',
          name: 'Revenue Analytics Report',
          description: 'Detailed financial performance and revenue trends',
          category: 'financial',
          parameters: {
            date_range: 'required',
            breakdown_by: 'optional',
            currency: 'optional'
          },
          sql_query: 'SELECT * FROM revenue_analytics_view WHERE ...',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
        {
          id: '3',
          name: 'Compliance Status Report',
          description: 'Entity compliance status and deadline tracking',
          category: 'compliance',
          parameters: {
            state_filter: 'optional',
            status_filter: 'optional',
            urgency_level: 'optional'
          },
          sql_query: 'SELECT * FROM compliance_view WHERE ...',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
        {
          id: '4',
          name: 'Security Audit Report',
          description: 'Security events, failed logins, and threat analysis',
          category: 'security',
          parameters: {
            date_range: 'required',
            severity_level: 'optional',
            event_type: 'optional'
          },
          sql_query: 'SELECT * FROM security_events_view WHERE ...',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
        {
          id: '5',
          name: 'Entity Portfolio Report',
          description: 'Complete entity portfolio analysis and insights',
          category: 'entities',
          parameters: {
            entity_type: 'optional',
            state_filter: 'optional',
            formation_date_range: 'optional'
          },
          sql_query: 'SELECT * FROM entity_portfolio_view WHERE ...',
          created_at: '2024-01-01T00:00:00Z',
          is_active: true,
        },
      ];

      const mockReports: CustomReport[] = [
        {
          id: 'r1',
          template_id: '1',
          name: 'Q1 User Activity Analysis',
          parameters: {
            date_range: '2024-01-01 to 2024-03-31',
            user_type: 'all',
            include_inactive: false
          },
          generated_at: '2024-01-08T10:30:00Z',
          status: 'completed',
          row_count: 2847,
        },
        {
          id: 'r2',
          template_id: '2',
          name: 'December Revenue Report',
          parameters: {
            date_range: '2024-12-01 to 2024-12-31',
            breakdown_by: 'subscription_tier',
            currency: 'USD'
          },
          generated_at: '2024-01-07T14:20:00Z',
          status: 'completed',
          row_count: 1234,
        },
        {
          id: 'r3',
          template_id: '4',
          name: 'Weekly Security Review',
          parameters: {
            date_range: '2024-01-01 to 2024-01-07',
            severity_level: 'medium',
            event_type: 'all'
          },
          generated_at: '2024-01-08T09:15:00Z',
          status: 'pending',
        },
      ];

      const mockExports: ExportJob[] = [
        {
          id: 'e1',
          report_id: 'r1',
          format: 'xlsx',
          status: 'completed',
          download_url: '/downloads/user-activity-q1.xlsx',
          created_at: '2024-01-08T11:00:00Z',
          completed_at: '2024-01-08T11:02:00Z',
        },
        {
          id: 'e2',
          report_id: 'r2',
          format: 'pdf',
          status: 'processing',
          created_at: '2024-01-08T12:30:00Z',
        },
      ];

      setReportTemplates(mockTemplates);
      setCustomReports(mockReports);
      setExportJobs(mockExports);
    } catch (err) {
      console.error('Error fetching reporting data:', err);
      setError('Failed to fetch reporting data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (templateId: string, parameters: Record<string, any>, name: string) => {
    try {
      const newReport: CustomReport = {
        id: `r${Date.now()}`,
        template_id: templateId,
        name,
        parameters,
        generated_at: new Date().toISOString(),
        status: 'pending',
      };

      setCustomReports(prev => [newReport, ...prev]);

      // Simulate report generation
      setTimeout(() => {
        setCustomReports(prev =>
          prev.map(report =>
            report.id === newReport.id
              ? { ...report, status: 'completed' as const, row_count: Math.floor(Math.random() * 5000) + 100 }
              : report
          )
        );
      }, 2000);

      return newReport.id;
    } catch (err) {
      console.error('Error generating report:', err);
      throw new Error('Failed to generate report');
    }
  };

  const exportReport = async (reportId: string, format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const newExport: ExportJob = {
        id: `e${Date.now()}`,
        report_id: reportId,
        format,
        status: 'queued',
        created_at: new Date().toISOString(),
      };

      setExportJobs(prev => [newExport, ...prev]);

      // Simulate export processing
      setTimeout(() => {
        setExportJobs(prev =>
          prev.map(job =>
            job.id === newExport.id
              ? {
                  ...job,
                  status: 'processing' as const,
                }
              : job
          )
        );
      }, 500);

      setTimeout(() => {
        setExportJobs(prev =>
          prev.map(job =>
            job.id === newExport.id
              ? {
                  ...job,
                  status: 'completed' as const,
                  download_url: `/downloads/report-${reportId}.${format}`,
                  completed_at: new Date().toISOString(),
                }
              : job
          )
        );
      }, 3000);

      return newExport.id;
    } catch (err) {
      console.error('Error exporting report:', err);
      throw new Error('Failed to export report');
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      setCustomReports(prev => prev.filter(report => report.id !== reportId));
      setExportJobs(prev => prev.filter(job => job.report_id !== reportId));
    } catch (err) {
      console.error('Error deleting report:', err);
      throw new Error('Failed to delete report');
    }
  };

  useEffect(() => {
    fetchReportingData();
  }, [isAdmin]);

  return {
    reportTemplates,
    customReports,
    exportJobs,
    loading,
    error,
    generateReport,
    exportReport,
    deleteReport,
    refetch: fetchReportingData,
  };
};