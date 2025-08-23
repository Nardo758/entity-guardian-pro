import React from 'react';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAccount as UserAccountType } from '@/types/entity';
import { useNavigate } from 'react-router-dom';

interface UserAccountProps {
  user: UserAccountType;
}

export const UserAccount: React.FC<UserAccountProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-4 rounded-xl border bg-glass backdrop-blur-sm px-6 py-3 shadow-modern hover:shadow-modern-lg transition-all duration-300 h-auto"
        >
          <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-2">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-wide">
            {user.name}
          </span>
          <Badge 
            variant="secondary" 
            className="text-xs capitalize bg-gradient-to-r from-primary/10 to-primary/20 text-primary border-primary/20 font-medium px-3 py-1"
          >
            ✨ {user.plan}
          </Badge>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};