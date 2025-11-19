import { AgentInvitation } from '@/types/agent';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Calendar, MessageSquare, CheckCircle, XCircle, Undo2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InvitationCardProps {
  invitation: AgentInvitation;
  userType: 'owner' | 'agent';
  onRespond?: (token: string, response: 'accepted' | 'declined') => Promise<void>;
  onUnsend?: (invitationId: string) => Promise<void>;
}

export function InvitationCard({ invitation, userType, onRespond, onUnsend }: InvitationCardProps) {
  const [responding, setResponding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'decline' | 'unsend' | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, className?: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      accepted: { variant: 'default', label: 'Accepted', className: 'bg-green-500 hover:bg-green-600' },
      declined: { variant: 'destructive', label: 'Declined' },
      unsent: { variant: 'outline', label: 'Unsent' },
      expired: { variant: 'destructive', label: 'Expired' },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const handleAction = async () => {
    if (!confirmAction) return;

    setResponding(true);
    try {
      if (confirmAction === 'unsend' && onUnsend) {
        await onUnsend(invitation.id);
        toast.success('Invitation cancelled successfully');
      } else if (onRespond && (confirmAction === 'accept' || confirmAction === 'decline')) {
        await onRespond(invitation.token, confirmAction === 'accept' ? 'accepted' : 'declined');
        toast.success(`Invitation ${confirmAction === 'accept' ? 'accepted' : 'declined'} successfully`);
      }
    } catch (error) {
      toast.error(`Failed to ${confirmAction} invitation`);
    } finally {
      setResponding(false);
      setShowConfirm(false);
      setConfirmAction(null);
    }
  };

  const openConfirm = (action: 'accept' | 'decline' | 'unsend') => {
    setConfirmAction(action);
    setShowConfirm(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {invitation.entity?.name || 'Entity'}
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span>{invitation.entity?.type} • {invitation.entity?.state}</span>
                {getStatusBadge(invitation.status)}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 inline mr-1" />
              {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{userType === 'owner' ? 'To:' : 'From:'}</span>
            <span className="text-muted-foreground">{invitation.agent_email}</span>
          </div>

          {invitation.message && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Message</p>
                  <p className="text-sm text-muted-foreground">{invitation.message}</p>
                </div>
              </div>
            </div>
          )}

          {invitation.viewed_at && (
            <p className="text-xs text-muted-foreground">
              Viewed {formatDistanceToNow(new Date(invitation.viewed_at), { addSuffix: true })}
            </p>
          )}

          {invitation.responded_at && (
            <p className="text-xs text-muted-foreground">
              Responded {formatDistanceToNow(new Date(invitation.responded_at), { addSuffix: true })}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {userType === 'owner' && invitation.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openConfirm('unsend')}
              disabled={responding}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Cancel Invitation
            </Button>
          )}

          {userType === 'agent' && invitation.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openConfirm('decline')}
                disabled={responding}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => openConfirm('accept')}
                disabled={responding}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'accept' && 'Accept Invitation?'}
              {confirmAction === 'decline' && 'Decline Invitation?'}
              {confirmAction === 'unsend' && 'Cancel Invitation?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'accept' && 
                'By accepting this invitation, you agree to serve as the registered agent for this entity.'}
              {confirmAction === 'decline' && 
                'This will notify the entity owner that you declined their invitation.'}
              {confirmAction === 'unsend' && 
                'This will cancel the invitation. The agent will no longer be able to respond to it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
