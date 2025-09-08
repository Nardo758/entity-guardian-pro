-- Add invitation status tracking and unsend functionality to agent_invitations table
ALTER TABLE public.agent_invitations 
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unsent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unsent_by UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_invitations_status ON public.agent_invitations(status);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_entity_owner ON public.agent_invitations(entity_owner_id);

-- Update RLS policies to allow unsending invitations
CREATE POLICY "Entity owners can unsend their invitations" 
ON public.agent_invitations 
FOR UPDATE 
USING (entity_owner_id = auth.uid() AND status = 'pending');

-- Create function to track invitation metrics
CREATE OR REPLACE FUNCTION public.get_agent_invitation_metrics(owner_id UUID)
RETURNS TABLE(
  total_sent BIGINT,
  pending_count BIGINT,
  accepted_count BIGINT,
  declined_count BIGINT,
  unsent_count BIGINT,
  entities_with_agents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH invitation_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE status != 'unsent' AND unsent_at IS NULL) as total_sent,
      COUNT(*) FILTER (WHERE status = 'pending' AND unsent_at IS NULL) as pending_count,
      COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
      COUNT(*) FILTER (WHERE status = 'declined') as declined_count,
      COUNT(*) FILTER (WHERE unsent_at IS NOT NULL) as unsent_count
    FROM agent_invitations
    WHERE entity_owner_id = owner_id
  ),
  entity_stats AS (
    SELECT COUNT(DISTINCT e.id) as entities_with_agents
    FROM entities e
    JOIN entity_agent_assignments eaa ON e.id = eaa.entity_id
    WHERE e.user_id = owner_id AND eaa.status = 'accepted'
  )
  SELECT 
    COALESCE(invitation_stats.total_sent, 0),
    COALESCE(invitation_stats.pending_count, 0),
    COALESCE(invitation_stats.accepted_count, 0),
    COALESCE(invitation_stats.declined_count, 0),
    COALESCE(invitation_stats.unsent_count, 0),
    COALESCE(entity_stats.entities_with_agents, 0)
  FROM invitation_stats
  CROSS JOIN entity_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;