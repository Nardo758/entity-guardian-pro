import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Calendar, FileText, DollarSign, Users, Settings, LayoutDashboard, Shield, BarChart3, Folder } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { UserAccount } from '@/components/UserAccount';

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { permissions } = useRolePermissions();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        url: permissions.isAdmin ? '/admin-dashboard' : permissions.isAgent ? '/agent-dashboard' : '/dashboard',
        icon: LayoutDashboard,
      },
    ];

    // Role-specific navigation
    if (permissions.isAdmin) {
      return [
        ...baseItems,
        {
          title: 'Users',
          url: '/admin-analytics',
          icon: Users,
        },
        {
          title: 'System',
          url: '/audit',
          icon: Shield,
        },
        {
          title: 'Analytics',
          url: '/analytics',
          icon: BarChart3,
        },
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ];
    }

    if (permissions.isAgent) {
      return [
        ...baseItems,
        {
          title: 'Entities',
          url: '/agent-dashboard',
          icon: Building2,
        },
        {
          title: 'Documents',
          url: '/documents',
          icon: FileText,
        },
        {
          title: 'Payments',
          url: '/payments',
          icon: DollarSign,
        },
        {
          title: 'Calendar',
          url: '/agent-dashboard',
          icon: Calendar,
        },
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ];
    }

    // Entity Owner navigation
    return [
      ...baseItems,
      {
        title: 'Entities',
        url: '/dashboard',
        icon: Building2,
      },
      {
        title: 'Documents',
        url: '/documents',
        icon: FileText,
      },
      {
        title: 'Payments',
        url: '/payments',
        icon: DollarSign,
      },
      {
        title: 'Calendar',
        url: '/dashboard',
        icon: Calendar,
      },
      {
        title: 'Agents',
        url: '/find-agents',
        icon: Users,
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
      },
    ];
  };

  const navigationItems = getNavigationItems();

  const isActive = (url: string) => {
    if (url === '/dashboard' && location.pathname === '/') return true;
    return location.pathname === url;
  };

  const getUserRoleDisplay = () => {
    if (permissions.isAdmin) return 'Administrator';
    if (permissions.isAgent) return 'Registered Agent';
    return 'Entity Owner';
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Entity Renewal Pro</span>
            <span className="text-xs text-muted-foreground">{getUserRoleDisplay()}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-2">CURRENT WORKSPACE</div>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>MAIN MENU</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={`w-full justify-start ${
                        active 
                          ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {active && (
                        <div className="ml-auto w-1 h-4 bg-primary rounded-full" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Additional sections based on role */}
        {permissions.isEntityOwner && (
          <SidebarGroup>
            <SidebarGroupLabel>QUICK ACTIONS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/team')}>
                    <Users className="w-4 h-4" />
                    <span>Team</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/billing')}>
                    <DollarSign className="w-4 h-4" />
                    <span>Billing</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/reports')}>
                    <Folder className="w-4 h-4" />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {permissions.isAgent && (
          <SidebarGroup>
            <SidebarGroupLabel>AGENT TOOLS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/agent-signup')}>
                    <Users className="w-4 h-4" />
                    <span>Profile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate('/billing')}>
                    <DollarSign className="w-4 h-4" />
                    <span>Billing</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <UserAccount />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;