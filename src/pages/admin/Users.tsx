import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users as UsersIcon } from 'lucide-react';

const Users: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage platform users and their permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            All Users
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            User management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
