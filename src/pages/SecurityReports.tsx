import React, { useState } from 'react';
import { useReportConfigs } from '@/hooks/useReportConfigs';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { ReportConfigForm } from '@/components/admin/ReportConfigForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Calendar,
  Users,
  AlertCircle,
} from 'lucide-react';

const SecurityReports: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  
  const { configs, isLoading, error, createConfig, updateConfig, deleteConfig, runReport } = useReportConfigs();
  const { adminUsers, isLoading: isLoadingUsers } = useAdminUsers();

  const handleCreate = (config: any) => {
    createConfig.mutate(config);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = (config: any) => {
    if (editingConfig) {
      updateConfig.mutate({ id: editingConfig.id, ...config });
      setEditingConfig(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this report configuration?')) {
      deleteConfig.mutate(id);
    }
  };

  const handleRun = (id: string) => {
    runReport.mutate(id);
  };

  const formatSchedule = (config: any) => {
    if (config.schedule_type === 'manual') return 'Manual only';
    const time = config.schedule_time.substring(0, 5);
    if (config.schedule_type === 'daily') {
      return `Daily at ${time} UTC`;
    }
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Weekly on ${days[config.schedule_day || 0]} at ${time} UTC`;
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load report configurations'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Security Report Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure automated security reports for admins
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {/* Info Card */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          After creating a report, remember to set up the corresponding cron job in Supabase SQL Editor.
          See SECURITY_REPORT_SETUP.md for instructions.
        </AlertDescription>
      </Alert>

      {/* Report Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configurations</CardTitle>
          <CardDescription>
            Manage automated security report schedules and recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !configs || configs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No report configurations yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                Create Your First Report
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contents</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatSchedule(config)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {config.recipient_user_ids.length} admin(s)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.is_enabled ? 'default' : 'secondary'}>
                        {config.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {config.include_ip_reputation && (
                          <Badge variant="outline" className="text-xs">IP</Badge>
                        )}
                        {config.include_violations && (
                          <Badge variant="outline" className="text-xs">Violations</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRun(config.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Run Now
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingConfig(config)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(config.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Report Configuration</DialogTitle>
            <DialogDescription>
              Set up a new automated security report
            </DialogDescription>
          </DialogHeader>
          {!isLoadingUsers && (
            <ReportConfigForm
              adminUsers={adminUsers}
              onSubmit={handleCreate}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report Configuration</DialogTitle>
            <DialogDescription>
              Update the automated security report settings
            </DialogDescription>
          </DialogHeader>
          {editingConfig && !isLoadingUsers && (
            <ReportConfigForm
              config={editingConfig}
              adminUsers={adminUsers}
              onSubmit={handleUpdate}
              onCancel={() => setEditingConfig(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityReports;
