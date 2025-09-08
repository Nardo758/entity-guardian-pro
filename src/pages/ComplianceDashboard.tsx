import React from 'react';
import { AdvancedComplianceTracker } from '@/components/AdvancedComplianceTracker';
import NavigationMenu from '@/components/NavigationMenu';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { UserAccount } from '@/components/UserAccount';
import { RealTimeNotifications } from '@/components/RealTimeNotifications';

const ComplianceDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <NavigationMenu />
            </div>
            <div className="flex items-center gap-4">
              <RealTimeNotifications />
              <TeamSwitcher />
              <UserAccount />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AdvancedComplianceTracker />
      </main>
    </div>
  );
};

export default ComplianceDashboard;