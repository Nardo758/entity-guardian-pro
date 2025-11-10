import React from 'react';
import { AdminBootstrap } from '@/components/AdminBootstrap';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminSetupPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <AdminBootstrap />
        
        <div className="mt-8 text-center">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">What Admin Access Gives You:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>✅ <strong>Unlimited entities</strong> - No limits on business entities</p>
                <p>✅ <strong>All agent features</strong> - Full agent management system</p>
                <p>✅ <strong>Advanced analytics</strong> - Deep insights and reporting</p>
              </div>
              <div className="space-y-2">
                <p>✅ <strong>Priority support</strong> - Get help when you need it</p>
                <p>✅ <strong>All future features</strong> - Access to new capabilities</p>
                <p>✅ <strong>No restrictions</strong> - Use all platform features</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetupPage;