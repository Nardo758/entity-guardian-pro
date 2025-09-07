-- Phase 1: Unified Role Management System
-- Consolidate role checking and create missing core tables

-- 1. Create unified role enum that covers all user types
CREATE TYPE public.unified_user_role AS ENUM ('admin', 'registered_agent', 'entity_owner');

-- 2. Add unified_role column to profiles table
ALTER TABLE public.profiles ADD COLUMN unified_role unified_user_role DEFAULT 'entity_owner';

-- 3. Update existing profiles based on current user_type
UPDATE public.profiles 
SET unified_role = CASE 
  WHEN user_type = 'registered_agent' THEN 'registered_agent'::unified_user_role
  WHEN user_type = 'admin' THEN 'admin'::unified_user_role
  ELSE 'entity_owner'::unified_user_role
END;

-- 4. Create support tickets table for admin management
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'compliance')),
  assigned_to UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for support tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Support ticket policies
CREATE POLICY "Users can create their own support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own support tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can access all support tickets" 
ON public.support_tickets 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- 5. Create compliance deadlines table
CREATE TABLE public.compliance_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  agent_id UUID,
  deadline_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'cancelled')),
  state TEXT NOT NULL,
  filing_fee DECIMAL(10,2),
  reminder_sent BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for compliance deadlines
ALTER TABLE public.compliance_deadlines ENABLE ROW LEVEL SECURITY;

-- Compliance deadline policies
CREATE POLICY "Entity owners can view their compliance deadlines" 
ON public.compliance_deadlines 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Entity owners can create compliance deadlines for their entities" 
ON public.compliance_deadlines 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.entities e 
  WHERE e.id = entity_id AND e.user_id = auth.uid()
));

CREATE POLICY "Assigned agents can view compliance deadlines" 
ON public.compliance_deadlines 
FOR SELECT 
USING (
  agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.agents a 
    WHERE a.id = agent_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can access all compliance deadlines" 
ON public.compliance_deadlines 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- 6. Create agent invoices table for billing
CREATE TABLE public.agent_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  entity_id UUID NOT NULL,
  entity_owner_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  service_period_start DATE NOT NULL,
  service_period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  services_provided JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for agent invoices
ALTER TABLE public.agent_invoices ENABLE ROW LEVEL SECURITY;

-- Agent invoice policies
CREATE POLICY "Agents can manage their own invoices" 
ON public.agent_invoices 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.agents a 
  WHERE a.id = agent_id AND a.user_id = auth.uid()
));

CREATE POLICY "Entity owners can view invoices for their entities" 
ON public.agent_invoices 
FOR SELECT 
USING (auth.uid() = entity_owner_id);

CREATE POLICY "Admins can access all agent invoices" 
ON public.agent_invoices 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- 7. Create agent documents table for forwarding system
CREATE TABLE public.agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  entity_id UUID NOT NULL,
  entity_owner_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'forwarded', 'archived')),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  forwarded_date DATE,
  notes TEXT,
  forwarding_method TEXT CHECK (forwarding_method IN ('email', 'mail', 'portal')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for agent documents
ALTER TABLE public.agent_documents ENABLE ROW LEVEL SECURITY;

-- Agent document policies
CREATE POLICY "Agents can manage documents for their entities" 
ON public.agent_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.agents a 
  WHERE a.id = agent_id AND a.user_id = auth.uid()
));

CREATE POLICY "Entity owners can view documents for their entities" 
ON public.agent_documents 
FOR SELECT 
USING (auth.uid() = entity_owner_id);

CREATE POLICY "Admins can access all agent documents" 
ON public.agent_documents 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
));

-- 8. Create updated_at triggers for new tables
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_deadlines_updated_at
  BEFORE UPDATE ON public.compliance_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_invoices_updated_at
  BEFORE UPDATE ON public.agent_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_documents_updated_at
  BEFORE UPDATE ON public.agent_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create indexes for better performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

CREATE INDEX idx_compliance_deadlines_entity_id ON public.compliance_deadlines(entity_id);
CREATE INDEX idx_compliance_deadlines_user_id ON public.compliance_deadlines(user_id);
CREATE INDEX idx_compliance_deadlines_agent_id ON public.compliance_deadlines(agent_id);
CREATE INDEX idx_compliance_deadlines_due_date ON public.compliance_deadlines(due_date);
CREATE INDEX idx_compliance_deadlines_status ON public.compliance_deadlines(status);

CREATE INDEX idx_agent_invoices_agent_id ON public.agent_invoices(agent_id);
CREATE INDEX idx_agent_invoices_entity_id ON public.agent_invoices(entity_id);
CREATE INDEX idx_agent_invoices_entity_owner_id ON public.agent_invoices(entity_owner_id);
CREATE INDEX idx_agent_invoices_status ON public.agent_invoices(status);
CREATE INDEX idx_agent_invoices_due_date ON public.agent_invoices(due_date);

CREATE INDEX idx_agent_documents_agent_id ON public.agent_documents(agent_id);
CREATE INDEX idx_agent_documents_entity_id ON public.agent_documents(entity_id);
CREATE INDEX idx_agent_documents_entity_owner_id ON public.agent_documents(entity_owner_id);
CREATE INDEX idx_agent_documents_status ON public.agent_documents(status);