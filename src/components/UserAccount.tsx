import React from 'react';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserAccount as UserAccountType } from '@/types/entity';

interface UserAccountProps {
  user: UserAccountType;
}

export const UserAccount: React.FC<UserAccountProps> = ({ user }) => {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">
        {user.name}
      </span>
      <Badge variant="secondary" className="text-xs capitalize bg-primary/10 text-primary">
        {user.plan}
      </Badge>
    </div>
  );
};