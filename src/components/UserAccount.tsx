import React from 'react';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserAccount as UserAccountType } from '@/types/entity';

interface UserAccountProps {
  user: UserAccountType;
}

export const UserAccount: React.FC<UserAccountProps> = ({ user }) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-glass backdrop-blur-sm px-6 py-3 shadow-modern hover:shadow-modern-lg transition-all duration-300">
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
    </div>
  );
};