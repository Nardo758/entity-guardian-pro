import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users as UsersIcon } from 'lucide-react';

const Users: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-slate-400">Manage platform users and their permissions</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-amber-500" />
            All Users
          </CardTitle>
          <CardDescription className="text-slate-400">
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">
            User management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
