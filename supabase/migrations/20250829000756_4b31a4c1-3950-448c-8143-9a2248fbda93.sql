-- Create officers table for entity management
CREATE TABLE public.officers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  appointment_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their entity officers" 
ON public.officers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create officers for their entities" 
ON public.officers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their entity officers" 
ON public.officers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their entity officers" 
ON public.officers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_officers_updated_at
BEFORE UPDATE ON public.officers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_officers_entity_id ON public.officers(entity_id);
CREATE INDEX idx_officers_user_id ON public.officers(user_id);