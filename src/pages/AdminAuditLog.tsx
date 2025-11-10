import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AdminAuditDashboard } from '@/components/AdminAuditDashboard';
import { AdminMFAGuard } from '@/components/AdminMFAGuard';

const AdminAuditLog = () => {
  const navigate = useNavigate();

  return (
    <AdminMFAGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin-dashboard')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Audit Log
              </h1>
              <p className="text-muted-foreground">
                Complete audit trail of all admin actions and security events
              </p>
            </div>
          </div>

          <AdminAuditDashboard />
        </div>
      </div>
    </AdminMFAGuard>
  );
};

export default AdminAuditLog;
