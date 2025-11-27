import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, Calendar, Building2, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entities: any[];
  users: any[];
  agents: any[];
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({
  isOpen,
  onClose,
  entities,
  users,
  agents
}) => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'audit'>('summary');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y' | 'all'>('30d');
  const [includeEntities, setIncludeEntities] = useState(true);
  const [includeUsers, setIncludeUsers] = useState(true);
  const [includeAgents, setIncludeAgents] = useState(true);
  const [includeFinancials, setIncludeFinancials] = useState(false);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return null;
    }
  };

  const generateReportData = () => {
    const dateFilter = getDateFilter();
    
    const filteredEntities = dateFilter 
      ? entities.filter(e => new Date(e.created_at) >= dateFilter)
      : entities;
    
    const filteredUsers = dateFilter
      ? users.filter(u => new Date(u.created_at) >= dateFilter)
      : users;

    // Calculate metrics
    const entityByState: Record<string, number> = {};
    const entityByType: Record<string, number> = {};
    const entityByStatus: Record<string, number> = {};

    filteredEntities.forEach(entity => {
      entityByState[entity.state] = (entityByState[entity.state] || 0) + 1;
      entityByType[entity.type] = (entityByType[entity.type] || 0) + 1;
      entityByStatus[entity.status || 'active'] = (entityByStatus[entity.status || 'active'] || 0) + 1;
    });

    const usersByType: Record<string, number> = {};
    filteredUsers.forEach(user => {
      const type = user.user_type || 'owner';
      usersByType[type] = (usersByType[type] || 0) + 1;
    });

    return {
      generatedAt: new Date().toISOString(),
      dateRange,
      reportType,
      summary: {
        totalEntities: filteredEntities.length,
        totalUsers: filteredUsers.length,
        totalAgents: agents.length,
        availableAgents: agents.filter(a => a.is_available).length,
      },
      entities: {
        byState: entityByState,
        byType: entityByType,
        byStatus: entityByStatus,
      },
      users: {
        byType: usersByType,
      },
      agents: {
        total: agents.length,
        available: agents.filter(a => a.is_available).length,
        avgPrice: agents.length > 0 
          ? agents.reduce((sum, a) => sum + (a.price_per_entity || 0), 0) / agents.length 
          : 0,
      }
    };
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const reportData = generateReportData();
      
      // Generate report content based on type
      let reportContent = '';
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      
      if (reportType === 'summary') {
        reportContent = generateSummaryReport(reportData);
      } else if (reportType === 'detailed') {
        reportContent = generateDetailedReport(reportData);
      } else {
        reportContent = generateAuditReport(reportData);
      }

      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_report_${reportType}_${timestamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Compliance report generated', {
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded`
      });
      onClose();
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryReport = (data: any) => {
    return `
COMPLIANCE SUMMARY REPORT
Generated: ${format(new Date(data.generatedAt), 'PPpp')}
Period: ${data.dateRange === 'all' ? 'All Time' : `Last ${data.dateRange}`}
Report Type: Summary

================================================================================
OVERVIEW
================================================================================
Total Entities: ${data.summary.totalEntities}
Total Users: ${data.summary.totalUsers}
Total Agents: ${data.summary.totalAgents}
Available Agents: ${data.summary.availableAgents}

================================================================================
ENTITIES BY STATE
================================================================================
${Object.entries(data.entities.byState)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .map(([state, count]) => `${state}: ${count}`)
  .join('\n')}

================================================================================
ENTITIES BY TYPE
================================================================================
${Object.entries(data.entities.byType)
  .map(([type, count]) => `${type}: ${count}`)
  .join('\n')}

================================================================================
ENTITIES BY STATUS
================================================================================
${Object.entries(data.entities.byStatus)
  .map(([status, count]) => `${status}: ${count}`)
  .join('\n')}

================================================================================
USERS BY TYPE
================================================================================
${Object.entries(data.users.byType)
  .map(([type, count]) => `${type}: ${count}`)
  .join('\n')}

================================================================================
AGENT STATISTICS
================================================================================
Total Agents: ${data.agents.total}
Available: ${data.agents.available}
Average Price per Entity: $${data.agents.avgPrice.toFixed(2)}

--- End of Report ---
    `.trim();
  };

  const generateDetailedReport = (data: any) => {
    return `
DETAILED COMPLIANCE REPORT
Generated: ${format(new Date(data.generatedAt), 'PPpp')}
Period: ${data.dateRange === 'all' ? 'All Time' : `Last ${data.dateRange}`}
Report Type: Detailed

================================================================================
EXECUTIVE SUMMARY
================================================================================

This report provides a detailed analysis of platform compliance metrics,
including entity registrations, user accounts, and registered agent activity.

Key Findings:
- ${data.summary.totalEntities} entities registered
- ${data.summary.totalUsers} active user accounts
- ${data.agents.available} of ${data.agents.total} agents available for assignments

${generateSummaryReport(data)}

================================================================================
COMPLIANCE RECOMMENDATIONS
================================================================================

1. Entity Compliance: Review entities with 'pending' status for timely processing
2. Agent Coverage: Ensure adequate agent coverage in high-demand states
3. User Verification: Implement periodic verification of user account information
4. Financial Auditing: Schedule quarterly financial compliance reviews

--- End of Detailed Report ---
    `.trim();
  };

  const generateAuditReport = (data: any) => {
    return `
AUDIT COMPLIANCE REPORT
Generated: ${format(new Date(data.generatedAt), 'PPpp')}
Period: ${data.dateRange === 'all' ? 'All Time' : `Last ${data.dateRange}`}
Report Type: Audit Trail

================================================================================
AUDIT CERTIFICATION
================================================================================

This document certifies that the following compliance metrics have been
reviewed and verified as of the report generation date.

Certification Details:
- Report Generated: ${format(new Date(), 'PPpp')}
- Data Period: ${data.dateRange === 'all' ? 'All Time' : `Last ${data.dateRange}`}
- Total Records Reviewed: ${data.summary.totalEntities + data.summary.totalUsers + data.summary.totalAgents}

${generateDetailedReport(data)}

================================================================================
AUDIT TRAIL VERIFICATION
================================================================================

[ ] Entity records verified
[ ] User accounts validated
[ ] Agent credentials confirmed
[ ] Financial records reconciled

Auditor Signature: _________________________
Date: _________________________

--- End of Audit Report ---
    `.trim();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Compliance Report
          </DialogTitle>
          <DialogDescription>
            Configure and generate a compliance report for your platform data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="detailed">Detailed Report</SelectItem>
                <SelectItem value="audit">Audit Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Sections */}
          <div className="space-y-3">
            <Label>Include in Report</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="entities" 
                  checked={includeEntities} 
                  onCheckedChange={(c) => setIncludeEntities(!!c)} 
                />
                <label htmlFor="entities" className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Entities ({entities.length})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="users" 
                  checked={includeUsers} 
                  onCheckedChange={(c) => setIncludeUsers(!!c)} 
                />
                <label htmlFor="users" className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users ({users.length})
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="agents" 
                  checked={includeAgents} 
                  onCheckedChange={(c) => setIncludeAgents(!!c)} 
                />
                <label htmlFor="agents" className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Agents ({agents.length})
                </label>
              </div>
            </div>
          </div>

          {/* Preview Stats */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Report Preview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{entities.length}</p>
                <p className="text-xs text-muted-foreground">Entities</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-xs text-muted-foreground">Agents</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerateReport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
