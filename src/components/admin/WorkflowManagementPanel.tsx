import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Workflow, Play, Pause, CheckCircle, Clock, AlertTriangle,
  User, Settings, FileText, CreditCard, UserPlus, ArrowRight,
  Calendar, Target, Users
} from 'lucide-react';
import { useWorkflowManagement } from '@/hooks/useWorkflowManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const WorkflowManagementPanel = () => {
  const { 
    workflows, 
    instances, 
    loading, 
    error,
    createWorkflowInstance,
    updateWorkflowStep,
    assignWorkflow 
  } = useWorkflowManagement();

  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [stepNotes, setStepNotes] = useState('');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load workflow data</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'entity_formation': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'compliance': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'document_review': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'payment_processing': return <CreditCard className="w-5 h-5 text-orange-600" />;
      case 'user_onboarding': return <UserPlus className="w-5 h-5 text-indigo-600" />;
      default: return <Workflow className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <Pause className="w-4 h-4 text-muted-foreground" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleStartWorkflow = async (templateId: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') => {
    try {
      await createWorkflowInstance(templateId, undefined, priority);
      toast.success('Workflow started successfully');
    } catch (err) {
      toast.error('Failed to start workflow');
    }
  };

  const handleCompleteStep = async (instanceId: string, stepId: string) => {
    try {
      await updateWorkflowStep(instanceId, stepId, 'completed', stepNotes);
      toast.success('Step completed successfully');
      setStepNotes('');
    } catch (err) {
      toast.error('Failed to complete step');
    }
  };

  const handleAssignWorkflow = async (instanceId: string, assigneeId: string) => {
    try {
      await assignWorkflow(instanceId, assigneeId);
      toast.success('Workflow assigned successfully');
    } catch (err) {
      toast.error('Failed to assign workflow');
    }
  };

  const getWorkflowProgress = (instance: any) => {
    if (instance.status === 'completed') return 100;
    if (instance.status === 'failed' || instance.status === 'cancelled') return 0;
    
    const workflow = workflows.find(w => w.id === instance.template_id);
    if (!workflow) return 0;
    
    return (instance.current_step / workflow.steps.length) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Workflow Management</h2>
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Workflow className="w-4 h-4 mr-2" />
              View All Workflows
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Workflow Templates</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(workflow.category)}
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{workflow.name}</h4>
                        <Badge variant="secondary">{workflow.category.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Steps:</span>
                        <span>{workflow.steps.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SLA:</span>
                        <span>{workflow.sla_hours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto-assign:</span>
                        <span>{workflow.auto_assign ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleStartWorkflow(workflow.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Workflow className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{instances.length}</p>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {instances.filter(i => i.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {instances.filter(i => i.status === 'in_progress' || i.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(instances.filter(i => i.status === 'completed').length / instances.length * 100 || 0)}%
                </p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Active Workflow Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {instances.filter(i => i.status !== 'completed').map((instance) => {
              const workflow = workflows.find(w => w.id === instance.template_id);
              const currentStepIndex = instance.current_step - 1;
              const currentStep = workflow?.steps[currentStepIndex];
              
              return (
                <div key={instance.id} className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(instance.status)}
                      <div>
                        <h4 className="font-medium text-foreground">{instance.template_name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Started {new Date(instance.started_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Due {new Date(instance.due_date).toLocaleDateString()}
                          </span>
                          {instance.assigned_to && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Assigned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(instance.priority)}>
                        {instance.priority}
                      </Badge>
                      <Badge variant={instance.status === 'completed' ? 'default' : 'secondary'}>
                        {instance.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{Math.round(getWorkflowProgress(instance))}%</span>
                    </div>
                    <Progress value={getWorkflowProgress(instance)} className="h-2" />
                  </div>

                  {/* Current Step */}
                  {currentStep && instance.status !== 'completed' && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-foreground">Current Step: {currentStep.name}</h5>
                          <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                        </div>
                        <Badge variant="outline">
                          Step {instance.current_step} of {workflow?.steps.length}
                        </Badge>
                      </div>

                      {instance.status === 'in_progress' && (
                        <div className="flex gap-2 mt-3">
                          {!instance.assigned_to && (
                            <Select onValueChange={(value) => handleAssignWorkflow(instance.id, value)}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin_001">Admin User</SelectItem>
                                <SelectItem value="agent_002">Agent Smith</SelectItem>
                                <SelectItem value="manager_003">Manager Jones</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Button 
                            size="sm"
                            onClick={() => handleCompleteStep(instance.id, currentStep.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete Step
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step History */}
                  {instance.step_history.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h6 className="font-medium mb-3">Step History</h6>
                      <div className="space-y-2">
                        {instance.step_history.map((step, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            {getStatusIcon(step.status)}
                            <span className="flex-1">{step.step_name}</span>
                            <span className="text-muted-foreground">
                              {step.completed_at && new Date(step.completed_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {instances.filter(i => i.status !== 'completed').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Workflow className="w-12 h-12 mx-auto mb-4" />
                <p>No active workflows. Start a workflow from the templates above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completed Workflows */}
      {instances.filter(i => i.status === 'completed').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Completed Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {instances.filter(i => i.status === 'completed').slice(0, 5).map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <h4 className="font-medium text-foreground">{instance.template_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Completed on {instance.completed_at && new Date(instance.completed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowManagementPanel;