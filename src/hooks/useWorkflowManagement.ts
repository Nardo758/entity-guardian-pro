import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'entity_formation' | 'compliance' | 'document_review' | 'payment_processing' | 'user_onboarding';
  steps: WorkflowStep[];
  approval_required: boolean;
  auto_assign: boolean;
  sla_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  step_order: number;
  assignee_role: 'admin' | 'manager' | 'agent' | 'auto';
  action_type: 'review' | 'approve' | 'process' | 'notify' | 'integrate';
  conditions: Record<string, any>;
  automation_rules?: Record<string, any>;
  estimated_duration_hours: number;
}

export interface WorkflowInstance {
  id: string;
  template_id: string;
  template_name: string;
  entity_id?: string;
  user_id: string;
  current_step: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  started_at: string;
  due_date: string;
  completed_at?: string;
  assigned_to?: string;
  metadata: Record<string, any>;
  step_history: StepExecution[];
}

export interface StepExecution {
  step_id: string;
  step_name: string;
  started_at: string;
  completed_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  assigned_to?: string;
  notes?: string;
  outputs?: Record<string, any>;
}

export const useWorkflowManagement = () => {
  const { isAdmin } = useAdminAccess();
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflowData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Mock workflow templates - in a real app, these would come from the database
      const mockWorkflows: WorkflowTemplate[] = [
        {
          id: '1',
          name: 'Entity Formation Process',
          description: 'Complete entity formation workflow with document review and filing',
          category: 'entity_formation',
          approval_required: true,
          auto_assign: true,
          sla_hours: 72,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          steps: [
            {
              id: 's1',
              name: 'Document Collection',
              description: 'Collect all required formation documents',
              step_order: 1,
              assignee_role: 'auto',
              action_type: 'process',
              conditions: { documents_required: ['articles', 'bylaws', 'ein_application'] },
              estimated_duration_hours: 2,
            },
            {
              id: 's2',
              name: 'Legal Review',
              description: 'Review documents for completeness and accuracy',
              step_order: 2,
              assignee_role: 'agent',
              action_type: 'review',
              conditions: { review_checklist: true },
              estimated_duration_hours: 4,
            },
            {
              id: 's3',
              name: 'State Filing',
              description: 'Submit formation documents to state authority',
              step_order: 3,
              assignee_role: 'admin',
              action_type: 'process',
              conditions: { payment_confirmed: true },
              estimated_duration_hours: 24,
            },
            {
              id: 's4',
              name: 'Completion Notification',
              description: 'Notify client of successful formation',
              step_order: 4,
              assignee_role: 'auto',
              action_type: 'notify',
              conditions: {},
              estimated_duration_hours: 1,
            },
          ],
        },
        {
          id: '2',
          name: 'Compliance Review Process',
          description: 'Quarterly compliance review and filing workflow',
          category: 'compliance',
          approval_required: false,
          auto_assign: true,
          sla_hours: 168,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          steps: [
            {
              id: 'c1',
              name: 'Compliance Assessment',
              description: 'Assess current compliance status',
              step_order: 1,
              assignee_role: 'agent',
              action_type: 'review',
              conditions: { assessment_criteria: ['annual_report', 'tax_status', 'licenses'] },
              estimated_duration_hours: 3,
            },
            {
              id: 'c2',
              name: 'Document Preparation',
              description: 'Prepare required compliance documents',
              step_order: 2,
              assignee_role: 'agent',
              action_type: 'process',
              conditions: { template_generation: true },
              estimated_duration_hours: 6,
            },
            {
              id: 'c3',
              name: 'Filing Submission',
              description: 'Submit compliance filings to authorities',
              step_order: 3,
              assignee_role: 'admin',
              action_type: 'process',
              conditions: { authorization_required: true },
              estimated_duration_hours: 2,
            },
          ],
        },
        {
          id: '3',
          name: 'User Onboarding',
          description: 'Complete new user onboarding and account setup',
          category: 'user_onboarding',
          approval_required: false,
          auto_assign: true,
          sla_hours: 24,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          steps: [
            {
              id: 'u1',
              name: 'Account Verification',
              description: 'Verify user identity and contact information',
              step_order: 1,
              assignee_role: 'auto',
              action_type: 'process',
              conditions: { verification_methods: ['email', 'phone'] },
              estimated_duration_hours: 1,
            },
            {
              id: 'u2',
              name: 'Profile Setup',
              description: 'Guide user through profile completion',
              step_order: 2,
              assignee_role: 'auto',
              action_type: 'process',
              conditions: { profile_completeness: 80 },
              estimated_duration_hours: 2,
            },
            {
              id: 'u3',
              name: 'Welcome Sequence',
              description: 'Send welcome emails and training materials',
              step_order: 3,
              assignee_role: 'auto',
              action_type: 'notify',
              conditions: { email_sequence: ['welcome', 'getting_started', 'features'] },
              estimated_duration_hours: 1,
            },
          ],
        },
      ];

      // Mock workflow instances
      const mockInstances: WorkflowInstance[] = [
        {
          id: 'i1',
          template_id: '1',
          template_name: 'Entity Formation Process',
          entity_id: 'ent_123',
          user_id: 'user_456',
          current_step: 2,
          status: 'in_progress',
          priority: 'high',
          started_at: '2024-01-07T10:00:00Z',
          due_date: '2024-01-10T10:00:00Z',
          assigned_to: 'agent_789',
          metadata: { entity_name: 'Tech Innovations LLC', state: 'Delaware' },
          step_history: [
            {
              step_id: 's1',
              step_name: 'Document Collection',
              started_at: '2024-01-07T10:00:00Z',
              completed_at: '2024-01-07T12:00:00Z',
              status: 'completed',
              assigned_to: 'system',
              outputs: { documents_collected: 3 },
            },
            {
              step_id: 's2',
              step_name: 'Legal Review',
              started_at: '2024-01-07T12:00:00Z',
              status: 'in_progress',
              assigned_to: 'agent_789',
            },
          ],
        },
        {
          id: 'i2',
          template_id: '2',
          template_name: 'Compliance Review Process',
          entity_id: 'ent_456',
          user_id: 'user_123',
          current_step: 1,
          status: 'pending',
          priority: 'medium',
          started_at: '2024-01-08T09:00:00Z',
          due_date: '2024-01-15T09:00:00Z',
          metadata: { quarter: 'Q4 2024', entities_count: 5 },
          step_history: [],
        },
        {
          id: 'i3',
          template_id: '3',
          template_name: 'User Onboarding',
          user_id: 'user_789',
          current_step: 3,
          status: 'completed',
          priority: 'low',
          started_at: '2024-01-06T14:30:00Z',
          due_date: '2024-01-07T14:30:00Z',
          completed_at: '2024-01-07T10:15:00Z',
          metadata: { user_type: 'entity_owner', signup_source: 'website' },
          step_history: [
            {
              step_id: 'u1',
              step_name: 'Account Verification',
              started_at: '2024-01-06T14:30:00Z',
              completed_at: '2024-01-06T15:00:00Z',
              status: 'completed',
              assigned_to: 'system',
            },
            {
              step_id: 'u2',
              step_name: 'Profile Setup',
              started_at: '2024-01-06T15:00:00Z',
              completed_at: '2024-01-07T09:30:00Z',
              status: 'completed',
              assigned_to: 'system',
            },
            {
              step_id: 'u3',
              step_name: 'Welcome Sequence',
              started_at: '2024-01-07T09:30:00Z',
              completed_at: '2024-01-07T10:15:00Z',
              status: 'completed',
              assigned_to: 'system',
            },
          ],
        },
      ];

      setWorkflows(mockWorkflows);
      setInstances(mockInstances);
    } catch (err) {
      console.error('Error fetching workflow data:', err);
      setError('Failed to fetch workflow data');
    } finally {
      setLoading(false);
    }
  };

  const createWorkflowInstance = async (templateId: string, entityId?: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') => {
    try {
      const template = workflows.find(w => w.id === templateId);
      if (!template) throw new Error('Template not found');

      const newInstance: WorkflowInstance = {
        id: `i_${Date.now()}`,
        template_id: templateId,
        template_name: template.name,
        entity_id: entityId,
        user_id: 'current_user_id', // Would be actual user ID
        current_step: 1,
        status: 'pending',
        priority,
        started_at: new Date().toISOString(),
        due_date: new Date(Date.now() + template.sla_hours * 60 * 60 * 1000).toISOString(),
        metadata: {},
        step_history: [],
      };

      setInstances(prev => [newInstance, ...prev]);
      return newInstance.id;
    } catch (err) {
      console.error('Error creating workflow instance:', err);
      throw new Error('Failed to create workflow instance');
    }
  };

  const updateWorkflowStep = async (instanceId: string, stepId: string, status: 'completed' | 'failed' | 'skipped', notes?: string, outputs?: Record<string, any>) => {
    try {
      setInstances(prev =>
        prev.map(instance => {
          if (instance.id !== instanceId) return instance;

          const updatedHistory = instance.step_history.map(step =>
            step.step_id === stepId
              ? {
                  ...step,
                  status,
                  completed_at: status === 'completed' ? new Date().toISOString() : step.completed_at,
                  notes,
                  outputs,
                }
              : step
          );

          // Move to next step if completed
          let newCurrentStep = instance.current_step;
          let newStatus = instance.status;

          if (status === 'completed') {
            const template = workflows.find(w => w.id === instance.template_id);
            if (template && instance.current_step < template.steps.length) {
              newCurrentStep = instance.current_step + 1;
            } else {
              newStatus = 'completed';
            }
          }

          return {
            ...instance,
            current_step: newCurrentStep,
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
            step_history: updatedHistory,
          };
        })
      );
    } catch (err) {
      console.error('Error updating workflow step:', err);
      throw new Error('Failed to update workflow step');
    }
  };

  const assignWorkflow = async (instanceId: string, assigneeId: string) => {
    try {
      setInstances(prev =>
        prev.map(instance =>
          instance.id === instanceId
            ? { ...instance, assigned_to: assigneeId, status: 'in_progress' as const }
            : instance
        )
      );
    } catch (err) {
      console.error('Error assigning workflow:', err);
      throw new Error('Failed to assign workflow');
    }
  };

  useEffect(() => {
    fetchWorkflowData();
  }, [isAdmin]);

  return {
    workflows,
    instances,
    loading,
    error,
    createWorkflowInstance,
    updateWorkflowStep,
    assignWorkflow,
    refetch: fetchWorkflowData,
  };
};