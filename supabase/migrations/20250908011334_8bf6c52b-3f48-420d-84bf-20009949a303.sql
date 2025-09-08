-- Add enhanced entity management columns
ALTER TABLE public.entities 
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'archived')),
ADD COLUMN tags text[],
ADD COLUMN priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
ADD COLUMN compliance_status text DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'pending', 'overdue', 'unknown')),
ADD COLUMN next_filing_date date,
ADD COLUMN annual_report_due_date date,
ADD COLUMN notes text;

-- Add indexes for better filtering performance
CREATE INDEX idx_entities_status ON public.entities(status);
CREATE INDEX idx_entities_state_type ON public.entities(state, type);
CREATE INDEX idx_entities_user_status ON public.entities(user_id, status);
CREATE INDEX idx_entities_compliance ON public.entities(compliance_status);
CREATE INDEX idx_entities_next_filing ON public.entities(next_filing_date) WHERE next_filing_date IS NOT NULL;
CREATE INDEX idx_entities_tags ON public.entities USING GIN(tags) WHERE tags IS NOT NULL;

-- Update existing entities with default values
UPDATE public.entities 
SET 
  status = 'active',
  compliance_status = 'compliant',
  priority = 3
WHERE status IS NULL OR compliance_status IS NULL OR priority IS NULL;