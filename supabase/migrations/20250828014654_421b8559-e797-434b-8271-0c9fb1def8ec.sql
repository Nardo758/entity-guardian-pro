-- Create analytics_data table for storing various metrics
CREATE TABLE public.analytics_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics_data
CREATE POLICY "Users can view their own analytics data" 
ON public.analytics_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics data" 
ON public.analytics_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics data" 
ON public.analytics_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics data" 
ON public.analytics_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create compliance_checks table
CREATE TABLE public.compliance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  check_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.compliance_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for compliance_checks
CREATE POLICY "Users can view their own compliance checks" 
ON public.compliance_checks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own compliance checks" 
ON public.compliance_checks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compliance checks" 
ON public.compliance_checks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own compliance checks" 
ON public.compliance_checks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create cost_projections table
CREATE TABLE public.cost_projections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  projection_type TEXT NOT NULL,
  projection_name TEXT NOT NULL,
  projected_amount NUMERIC NOT NULL,
  projection_date DATE NOT NULL,
  actual_amount NUMERIC,
  variance NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cost_projections ENABLE ROW LEVEL SECURITY;

-- Create policies for cost_projections
CREATE POLICY "Users can view their own cost projections" 
ON public.cost_projections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cost projections" 
ON public.cost_projections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost projections" 
ON public.cost_projections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cost projections" 
ON public.cost_projections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_analytics_data_updated_at
BEFORE UPDATE ON public.analytics_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_checks_updated_at
BEFORE UPDATE ON public.compliance_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_projections_updated_at
BEFORE UPDATE ON public.cost_projections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_analytics_data_user_id ON public.analytics_data(user_id);
CREATE INDEX idx_analytics_data_entity_id ON public.analytics_data(entity_id);
CREATE INDEX idx_analytics_data_metric_type ON public.analytics_data(metric_type);
CREATE INDEX idx_analytics_data_metric_date ON public.analytics_data(metric_date);

CREATE INDEX idx_compliance_checks_user_id ON public.compliance_checks(user_id);
CREATE INDEX idx_compliance_checks_entity_id ON public.compliance_checks(entity_id);
CREATE INDEX idx_compliance_checks_status ON public.compliance_checks(status);
CREATE INDEX idx_compliance_checks_due_date ON public.compliance_checks(due_date);

CREATE INDEX idx_cost_projections_user_id ON public.cost_projections(user_id);
CREATE INDEX idx_cost_projections_entity_id ON public.cost_projections(entity_id);
CREATE INDEX idx_cost_projections_projection_date ON public.cost_projections(projection_date);