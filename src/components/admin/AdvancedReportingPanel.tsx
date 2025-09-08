import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, Download, Plus, Play, Clock, CheckCircle, 
  XCircle, Trash2, FileSpreadsheet, FileImage, Calendar,
  BarChart, Users, DollarSign, Shield
} from 'lucide-react';
import { useAdvancedReporting } from '@/hooks/useAdvancedReporting';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdvancedReportingPanel = () => {
  const { 
    reportTemplates, 
    customReports, 
    exportJobs, 
    loading, 
    error,
    generateReport,
    exportReport,
    deleteReport 
  } = useAdvancedReporting();

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportName, setReportName] = useState('');
  const [reportParameters, setReportParameters] = useState<Record<string, any>>({});

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
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
          <p className="text-destructive">Failed to load reporting data</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'users': return <Users className="w-5 h-5 text-blue-600" />;
      case 'financial': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'entities': return <BarChart className="w-5 h-5 text-purple-600" />;
      case 'compliance': return <FileText className="w-5 h-5 text-orange-600" />;
      case 'security': return <Shield className="w-5 h-5 text-red-600" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'xlsx': return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case 'csv': return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
      case 'pdf': return <FileImage className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportName) {
      toast.error('Please select a template and enter a report name');
      return;
    }

    try {
      await generateReport(selectedTemplate, reportParameters, reportName);
      toast.success('Report generation started');
      setIsGenerateDialogOpen(false);
      setSelectedTemplate('');
      setReportName('');
      setReportParameters({});
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  const handleExportReport = async (reportId: string, format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      await exportReport(reportId, format);
      toast.success(`Export started - ${format.toUpperCase()} format`);
    } catch (err) {
      toast.error('Failed to start export');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      toast.success('Report deleted successfully');
    } catch (err) {
      toast.error('Failed to delete report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Advanced Reporting</h2>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Custom Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Report Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report template" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Report Name</Label>
                <Input
                  id="name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name"
                />
              </div>

              {selectedTemplate && (
                <div className="space-y-3">
                  <Label>Report Parameters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateRange">Date Range</Label>
                      <Input
                        id="dateRange"
                        type="date"
                        value={reportParameters.start_date || ''}
                        onChange={(e) => setReportParameters(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={reportParameters.end_date || ''}
                        onChange={(e) => setReportParameters(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateReport}>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{template.name}</h4>
                      <Badge variant="secondary" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setIsGenerateDialogOpen(true);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(report.status)}
                  <div>
                    <h4 className="font-medium text-foreground">{report.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.generated_at).toLocaleString()}
                      </span>
                      {report.row_count && (
                        <span>{report.row_count.toLocaleString()} records</span>
                      )}
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {report.status === 'completed' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportReport(report.id, 'xlsx')}
                      >
                        <FileSpreadsheet className="w-4 h-4 mr-1" />
                        Excel
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExportReport(report.id, 'pdf')}
                      >
                        <FileImage className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {customReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>No reports generated yet. Create your first report using the templates above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Jobs */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportJobs.map((job) => {
                const report = customReports.find(r => r.id === job.report_id);
                return (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFormatIcon(job.format)}
                      <div>
                        <p className="font-medium text-foreground">{report?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.format.toUpperCase()} export • {new Date(job.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                      {job.status === 'completed' && job.download_url && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedReportingPanel;