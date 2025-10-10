import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building, LayoutDashboard, Plus, FileText, CreditCard, Calendar, Users,
  Settings, Crown, Menu, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarInset, SidebarProvider, SidebarTrigger, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useSubscription } from '@/hooks/useSubscription';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAdminAccess();
  const { subscription } = useSubscription();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Entities', icon: Building, path: '/entities' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Payments', icon: CreditCard, path: '/payments' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Agents', icon: Users, path: '/agents' },
  ];

  if (isAdmin) {
    navigationItems.push({ name: 'Admin', icon: Crown, path: '/admin-dashboard' });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      collapsible="icon"
      className="transition-all duration-300 z-50"
      style={{
        '--sidebar-width-icon': '4.5rem',
      } as React.CSSProperties}
    >
      <SidebarRail className="z-50" />
      <SidebarContent className="flex flex-col h-full bg-sidebar-background border-r border-sidebar-border z-50">
        {/* Logo Section */}
        <div className={`relative w-full flex items-center border-b border-sidebar-border ${collapsed
            ? 'flex-col gap-2 px-2 py-3 justify-center'
            : 'gap-3 p-4'
          }`}>
          <div className="bg-primary rounded-xl p-2 flex-shrink-0">
            <Building className="h-5 w-5 text-primary-foreground" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-lg text-sidebar-foreground truncate">Entity Renewal Pro</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Business Management</p>
            </div>
          )}

          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 hover:bg-sidebar-accent flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-sidebar-foreground/70" />
            </Button>
          )}

          {collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 hover:bg-sidebar-accent"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4 text-sidebar-foreground/70" />
            </Button>
          )}
        </div>

        {/* Team Switcher */}
        {!collapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="space-y-2">
              <label className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide">
                Current Workspace
              </label>
              <TeamSwitcher />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {!collapsed && (
            <label className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide px-3 mb-3 block">
              Main Menu
            </label>
          )}
          {navigationItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 text-left rounded-lg transition-all duration-200 group ${isActive(item.path)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive(item.path)
                  ? 'text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
                }`} />
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Subscription Status */}
        {!collapsed && (
          <div className="p-4 border-t border-sidebar-border">
            {subscription.subscribed ? (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-success"></div>
                  <span className="text-sm font-medium text-success">
                    {subscription.subscription_tier} Plan
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate('/billing')}
                >
                  Manage Plan
                </Button>
              </div>
            ) : (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-warning"></div>
                  <span className="text-sm font-medium text-warning">Free Plan</span>
                </div>
                <p className="text-xs text-sidebar-foreground/60 mb-2">Limited to 3 entities</p>
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate('/billing')}
                >
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>
        )}
      </SidebarContent>
    </Sidebar>


  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset className="overflow-hidden">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};