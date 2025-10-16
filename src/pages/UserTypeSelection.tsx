import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, UserCheck, ArrowRight, CheckCircle } from 'lucide-react';

const UserTypeSelection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
            Choose Your Account Type
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the option that best describes your role to get started with the right features for you
          </p>
        </div>

        {/* User Type Cards - remove completely */}
        {/* Footer with support only */}
        <div className="text-center pt-8">
          <p className="text-xs text-muted-foreground mt-2">
            Not sure which option is right for you?{" "}
            <Link to="/support" className="text-primary hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;