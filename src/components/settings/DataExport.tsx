import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileJson, FileText, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const DataExport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    profile: true,
    entities: true,
    documents: true,
    payments: true,
    notifications: true,
  });

  const handleExport = async (format: 'json' | 'csv') => {
    setLoading(true);
    try {
      const exportData: any = {};

      // Fetch profile data
      if (exportOptions.profile) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();
        exportData.profile = profile;
      }

      // Fetch entities
      if (exportOptions.entities) {
        const { data: entities } = await supabase
          .from('entities')
          .select('*')
          .eq('user_id', user?.id);
        exportData.entities = entities;
      }

      // Fetch documents metadata
      if (exportOptions.documents) {
        const { data: documents } = await supabase
          .from('documents')
          .select('id, file_name, file_type, file_size, created_at')
          .eq('user_id', user?.id);
        exportData.documents = documents;
      }

      // Fetch payments
      if (exportOptions.payments) {
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user?.id);
        exportData.payments = payments;
      }

      // Fetch notifications
      if (exportOptions.notifications) {
        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user?.id);
        exportData.notifications = notifications;
      }

      // Generate file
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `account-data-${timestamp}.${format}`;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        downloadFile(blob, fileName);
      } else {
        // Convert to CSV (simplified - only top-level data)
        const csvData = convertToCSV(exportData);
        const blob = new Blob([csvData], { type: 'text/csv' });
        downloadFile(blob, fileName);
      }

      toast.success(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any): string => {
    let csv = 'Data Type,Count\n';
    
    Object.keys(data).forEach(key => {
      const value = data[key];
      const count = Array.isArray(value) ? value.length : 1;
      csv += `${key},${count}\n`;
    });

    return csv;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Export Account Data
        </CardTitle>
        <CardDescription>
          Download a copy of all your account data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base">Select data to export:</Label>
          
          <div className="space-y-3 ml-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="profile"
                checked={exportOptions.profile}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, profile: checked as boolean }))
                }
              />
              <Label htmlFor="profile" className="cursor-pointer font-normal">
                Profile information
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="entities"
                checked={exportOptions.entities}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, entities: checked as boolean }))
                }
              />
              <Label htmlFor="entities" className="cursor-pointer font-normal">
                Entities and business information
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="documents"
                checked={exportOptions.documents}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, documents: checked as boolean }))
                }
              />
              <Label htmlFor="documents" className="cursor-pointer font-normal">
                Document metadata (files not included)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="payments"
                checked={exportOptions.payments}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, payments: checked as boolean }))
                }
              />
              <Label htmlFor="payments" className="cursor-pointer font-normal">
                Payment history
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifications"
                checked={exportOptions.notifications}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, notifications: checked as boolean }))
                }
              />
              <Label htmlFor="notifications" className="cursor-pointer font-normal">
                Notification history
              </Label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-3">
          <Label className="text-base">Export format:</Label>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              disabled={loading}
              className="flex-1"
            >
              <FileJson className="h-4 w-4 mr-2" />
              Export as JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={loading}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Privacy Notice:</p>
          <p>Your exported data will be downloaded directly to your device. We don't store or transmit this data to any external servers.</p>
        </div>
      </CardContent>
    </Card>
  );
};
