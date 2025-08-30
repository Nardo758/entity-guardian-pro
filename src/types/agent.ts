export interface Agent {
  id: string;
  user_id: string;
  company_name?: string;
  states: string[];
  price_per_entity: number;
  contact_email?: string;
  is_available: boolean;
  bio?: string;
  years_experience?: number;
  created_at: string;
  updated_at: string;
}

export interface AgentInvitation {
  id: string;
  entity_id: string;
  entity_owner_id: string;
  agent_email: string;
  agent_id?: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  message?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  entity?: {
    id: string;
    name: string;
    type: string;
    state: string;
  };
  agent?: Agent;
}

export interface EntityAgentAssignment {
  id: string;
  entity_id: string;
  agent_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'terminated';
  invited_at: string;
  responded_at?: string;
  invitation_token?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  entity?: {
    id: string;
    name: string;
    type: string;
    state: string;
  };
  agent?: Agent;
}

export interface AgentSearchFilters {
  state?: string;
  maxPrice?: number;
  minExperience?: number;
  availableOnly?: boolean;
}