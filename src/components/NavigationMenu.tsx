import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  BarChart3, 
  Settings, 
  Search,
  Home,
  UserCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const NavigationMenu: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  
  const isAgent = profile?.user_type === 'registered_agent';
  const isAdmin = profile?.is_admin || false;

  // Entity Owner Navigation
  const entityOwnerLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/find-agents', icon: Search, label: 'Find Agents' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Admin-specific links
  const adminLinks = [
    { href: '/ip-reputation', icon: Shield, label: 'IP Reputation', adminOnly: true },
  ];

  // Agent Navigation
  const agentLinks = [
    { href: '/agent-dashboard', icon: Home, label: 'Agent Dashboard' },
    { href: '/settings', icon: Settings, label: 'Profile Settings' },
  ];

  const baseLinks = isAgent ? agentLinks : entityOwnerLinks;
  const navigationLinks = isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <nav className="flex items-center gap-6">
      {/* Account Type Badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant={isAgent ? "secondary" : "default"}
          className={cn(
            "text-xs font-medium",
            isAgent 
              ? "bg-info/10 text-info border-info/20" 
              : "bg-primary/10 text-primary border-primary/20"
          )}
        >
          {isAgent ? (
            <>
              <UserCircle className="w-3 h-3 mr-1" />
              Agent Account
            </>
          ) : (
            <>
              <Building className="w-3 h-3 mr-1" />
              Owner Account
            </>
          )}
        </Badge>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-1">
        {navigationLinks.map((link) => {
          const isActive = location.pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default NavigationMenu;