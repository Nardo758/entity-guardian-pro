import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Send, Inbox, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { InvitationCard } from '@/components/InvitationCard';
import { supabase } from '@/integrations/supabase/client';

export default function AgentInvitations() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'owner' | 'agent' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { invitations, loading, error, metrics, respondToInvitation, unsendInvitation, refetch } = useAgentInvitations();

  useEffect(() => {
    const checkUserType = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(user.id);

      // Check if user is an agent
      const { data: agentProfile } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setUserType(agentProfile ? 'agent' : 'owner');
    };

    checkUserType();
  }, [navigate]);

  if (loading || userType === null) {
    return <LoadingState message="Loading invitations..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Agent Invitations</h1>
        <p className="text-muted-foreground">
          {userType === 'owner' 
            ? 'Manage your sent invitations to agents' 
            : 'View and respond to invitations from entity owners'}
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSent}</div>
            <p className="text-xs text-muted-foreground">Invitations sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.acceptedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.declinedCount}</div>
            <p className="text-xs text-muted-foreground">Not accepted</p>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      {userType === 'owner' ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({invitations.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({metrics.pendingCount})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({metrics.acceptedCount})</TabsTrigger>
            <TabsTrigger value="declined">Declined ({metrics.declinedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {invitations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No invitations sent yet</p>
                  <Button onClick={() => navigate('/agents/directory')} className="mt-4">
                    Browse Agents
                  </Button>
                </CardContent>
              </Card>
            ) : (
              invitations.map(invitation => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  userType="owner"
                  onUnsend={unsendInvitation}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {invitations.filter(inv => inv.status === 'pending').map(invitation => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                userType="owner"
                onUnsend={unsendInvitation}
              />
            ))}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {invitations.filter(inv => inv.status === 'accepted').map(invitation => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                userType="owner"
              />
            ))}
          </TabsContent>

          <TabsContent value="declined" className="space-y-4">
            {invitations.filter(inv => inv.status === 'declined').map(invitation => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                userType="owner"
              />
            ))}
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending ({metrics.pendingCount})</TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({metrics.acceptedCount})</TabsTrigger>
            <TabsTrigger value="declined">Declined ({metrics.declinedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending invitations</p>
                </CardContent>
              </Card>
            ) : (
              invitations.filter(inv => inv.status === 'pending').map(invitation => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  userType="agent"
                  onRespond={respondToInvitation}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="accepted" className="space-y-4">
            {invitations.filter(inv => inv.status === 'accepted').map(invitation => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                userType="agent"
              />
            ))}
          </TabsContent>

          <TabsContent value="declined" className="space-y-4">
            {invitations.filter(inv => inv.status === 'declined').map(invitation => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                userType="agent"
              />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
