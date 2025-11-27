import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, CheckCircle, Clock, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { SupportTicket, TicketMessage } from '@/hooks/useAdminSupportTickets';

interface SupportTicketModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTicket: (updates: { ticketId: string; updates: Partial<SupportTicket> }) => void;
  onSendMessage: (data: { ticketId: string; message: string; isInternal: boolean }) => void;
  onResolveTicket: (data: { ticketId: string; resolutionNotes: string }) => void;
  fetchMessages: (ticketId: string) => Promise<TicketMessage[]>;
  isUpdating: boolean;
  isSending: boolean;
  isResolving: boolean;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed: 'bg-muted text-muted-foreground border-border',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdateTicket,
  onSendMessage,
  onResolveTicket,
  fetchMessages,
  isUpdating,
  isSending,
  isResolving,
}) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (ticket && isOpen) {
      setLoadingMessages(true);
      fetchMessages(ticket.id)
        .then(setMessages)
        .catch(console.error)
        .finally(() => setLoadingMessages(false));
    }
  }, [ticket, isOpen, fetchMessages]);

  const handleSendMessage = () => {
    if (!ticket || !newMessage.trim()) return;
    onSendMessage({ ticketId: ticket.id, message: newMessage, isInternal: isInternalNote });
    setNewMessage('');
    setIsInternalNote(false);
    // Refresh messages
    fetchMessages(ticket.id).then(setMessages);
  };

  const handleResolve = () => {
    if (!ticket) return;
    onResolveTicket({ ticketId: ticket.id, resolutionNotes });
    setShowResolveForm(false);
    setResolutionNotes('');
  };

  const handleStatusChange = (status: string) => {
    if (!ticket) return;
    onUpdateTicket({ ticketId: ticket.id, updates: { status } });
  };

  const handlePriorityChange = (priority: string) => {
    if (!ticket) return;
    onUpdateTicket({ ticketId: ticket.id, updates: { priority } });
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ticket #{ticket.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Left column - Ticket details */}
          <div className="col-span-1 space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Subject</Label>
              <p className="font-medium">{ticket.subject}</p>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">User</Label>
              <p className="font-medium">{ticket.user_name || 'Unknown'}</p>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Category</Label>
              <p className="capitalize">{ticket.category}</p>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Select value={ticket.status} onValueChange={handleStatusChange} disabled={isUpdating}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Priority</Label>
              <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={isUpdating}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Created</Label>
              <p className="text-sm">{format(new Date(ticket.created_at), 'PPp')}</p>
            </div>

            {ticket.resolved_at && (
              <div>
                <Label className="text-muted-foreground text-xs">Resolved</Label>
                <p className="text-sm">{format(new Date(ticket.resolved_at), 'PPp')}</p>
              </div>
            )}

            <Separator />

            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <Button
                onClick={() => setShowResolveForm(!showResolveForm)}
                variant="outline"
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Ticket
              </Button>
            )}

            {showResolveForm && (
              <div className="space-y-2">
                <Label>Resolution Notes</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  rows={3}
                />
                <Button
                  onClick={handleResolve}
                  disabled={isResolving || !resolutionNotes.trim()}
                  className="w-full"
                >
                  {isResolving ? 'Resolving...' : 'Confirm Resolution'}
                </Button>
              </div>
            )}
          </div>

          {/* Right column - Messages */}
          <div className="col-span-2 flex flex-col border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="font-medium text-sm">Conversation</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Original description */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <User className="h-3 w-3" />
                    <span>Original Request</span>
                    <Clock className="h-3 w-3 ml-auto" />
                    <span>{format(new Date(ticket.created_at), 'PPp')}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {loadingMessages ? (
                  <p className="text-center text-muted-foreground text-sm">Loading messages...</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-lg p-3 ${
                        msg.sender_type === 'admin'
                          ? msg.is_internal
                            ? 'bg-yellow-500/10 border border-yellow-500/20'
                            : 'bg-primary/10 border border-primary/20'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {msg.sender_type === 'admin' ? (
                          <>
                            <Shield className="h-3 w-3" />
                            <span>Admin Response</span>
                            {msg.is_internal && (
                              <Badge variant="outline" className="text-xs py-0">Internal Note</Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3" />
                            <span>User</span>
                          </>
                        )}
                        <Clock className="h-3 w-3 ml-auto" />
                        <span>{format(new Date(msg.created_at), 'PPp')}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                )}

                {ticket.resolution_notes && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                      <CheckCircle className="h-3 w-3" />
                      <span>Resolution</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{ticket.resolution_notes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {ticket.status !== 'closed' && (
              <div className="p-3 border-t space-y-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="internal"
                      checked={isInternalNote}
                      onCheckedChange={(checked) => setIsInternalNote(checked as boolean)}
                    />
                    <Label htmlFor="internal" className="text-sm text-muted-foreground">
                      Internal note (not visible to user)
                    </Label>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
