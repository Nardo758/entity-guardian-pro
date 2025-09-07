import React from 'react';
import { Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserAccount } from '@/components/UserAccount';
import { EnhancedNotificationBanner } from '@/components/EnhancedNotificationBanner';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  onAddEntity: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onAddEntity
}) => {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
              <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                Live
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <EnhancedNotificationBanner />
          <Button
            onClick={onAddEntity}
            size="sm"
            className="font-medium shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Entity
          </Button>
          <UserAccount />
        </div>
      </div>
    </header>
  );
};