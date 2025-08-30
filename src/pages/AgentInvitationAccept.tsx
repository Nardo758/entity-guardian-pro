import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Building, MapPin, User, Clock } from 'lucide-react';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const AgentInvitationAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getInvitationByToken, respondToInvitation } = useAgentInvitations();
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const invitationData = await getInvitationByToken(token);
        if (!invitationData) {
          setError('Invitation not found or expired');
        } else if (invitationData.status !== 'pending') {
          setError(`This invitation has already been ${invitationData.status}`);
        } else if (new Date(invitationData.expires_at) < new Date()) {
          setError('This invitation has expired');
        } else {
          setInvitation(invitationData);
        }
      } catch (err) {
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, getInvitationByToken]);

  const handleResponse = async (response: 'accepted' | 'declined') => {
    if (!token || !user) return;
    
    setResponding(true);
    try {
      await respondToInvitation(token, response);
      
      if (response === 'accepted') {
        toast.success('Invitation accepted! You are now the registered agent for this entity.');
        navigate('/agent-dashboard');
      } else {
        toast.success('Invitation declined.');
        navigate('/agent-dashboard');
      }
    } catch (err) {
      toast.error('Failed to respond to invitation. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please sign in to respond to this invitation.
            </p>
            <Button 
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              <XCircle className="w-6 h-6 mx-auto mb-2" />
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{error}</p>
            <Button 
              onClick={() => navigate('/agent-dashboard')}
              className="w-full"
              variant="outline"
            >
              Go to Agent Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Registered Agent Invitation</CardTitle>
          <p className="text-muted-foreground">
            You've been invited to serve as a registered agent
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Entity Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">{invitation.entity?.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{invitation.entity?.type} • {invitation.entity?.state}</span>
            </div>

            {invitation.message && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground italic">
                  "{invitation.message}"
                </p>
              </div>
            )}
          </div>

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary">
                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expires:</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className={isExpired ? 'text-destructive' : ''}>
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isExpired && invitation.status === 'pending' ? (
            <div className="flex gap-3">
              <Button
                onClick={() => handleResponse('accepted')}
                disabled={responding}
                className="flex-1 bg-success hover:bg-success/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {responding ? 'Processing...' : 'Accept'}
              </Button>
              
              <Button
                onClick={() => handleResponse('declined')}
                disabled={responding}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {responding ? 'Processing...' : 'Decline'}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {isExpired ? 'This invitation has expired.' : 'This invitation is no longer pending.'}
              </p>
              <Button 
                onClick={() => navigate('/agent-dashboard')}
                variant="outline"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Terms Notice */}
          <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
            By accepting this invitation, you agree to serve as the registered agent 
            for this entity according to the terms of your service agreement.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentInvitationAccept;