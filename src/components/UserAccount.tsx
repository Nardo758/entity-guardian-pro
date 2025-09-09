import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const UserAccount: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account.",
        });
        // AuthContext handles redirect to landing page
      }
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
        <User className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  const displayName = profile.first_name && profile.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-auto p-3 w-full justify-between bg-gradient-to-r from-glass to-glass-border backdrop-blur-sm border border-glass-border hover:bg-glass-border/50 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="font-medium text-sm text-foreground">{displayName}</div>
              <Badge variant="secondary" className="text-xs px-2 py-0 bg-primary/10 text-primary border-primary/20">
                {profile.plan}
              </Badge>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={() => navigate('/settings')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};